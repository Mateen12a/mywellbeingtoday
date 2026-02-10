import { Appointment, Provider, WellbeingReport } from '../models/index.js';
import { sendAppointmentConfirmation, sendNotification } from '../services/emailService.js';
import { createAppointmentBookedNotification, createAppointmentCancelledNotification } from '../services/notificationService.js';
import { AppError } from '../middlewares/errorHandler.js';
import { logAction } from '../middlewares/auditLog.js';
import { APPOINTMENT_STATUS } from '../config/constants.js';
import { sendPushToUser } from '../services/pushService.js';

export const createAppointment = async (req, res, next) => {
  try {
    const { providerId, dateTime, type, reason, wellbeingReportId, duration = 30 } = req.body;

    const provider = await Provider.findById(providerId).populate('userId', 'email profile');
    if (!provider) {
      throw new AppError('Provider not found', 404, 'PROVIDER_NOT_FOUND');
    }

    if (!provider.isActive || !provider.availability.acceptingNewPatients) {
      throw new AppError('Provider is not accepting new appointments', 400, 'PROVIDER_UNAVAILABLE');
    }

    const appointmentDate = new Date(dateTime);
    const endTime = new Date(appointmentDate.getTime() + duration * 60000);

    const conflictingAppointment = await Appointment.findOne({
      providerId,
      status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED] },
      $or: [
        { dateTime: { $lt: endTime }, endTime: { $gt: appointmentDate } }
      ]
    });

    if (conflictingAppointment) {
      throw new AppError('This time slot is not available', 409, 'SLOT_UNAVAILABLE');
    }

    let autoFilledFromReport = false;
    let appointmentReason = reason;

    if (wellbeingReportId) {
      const report = await WellbeingReport.findOne({
        _id: wellbeingReportId,
        userId: req.user._id
      });
      if (report) {
        autoFilledFromReport = true;
        if (!reason) {
          appointmentReason = `Wellbeing consultation. Report summary: ${report.analysis.summary?.substring(0, 200) || 'Based on recent wellbeing assessment'}`;
        }
      }
    }

    const appointment = await Appointment.create({
      userId: req.user._id,
      providerId,
      dateTime: appointmentDate,
      endTime,
      duration,
      type,
      reason: appointmentReason,
      wellbeingReportId: wellbeingReportId || undefined,
      autoFilledFromReport,
      status: APPOINTMENT_STATUS.PENDING
    });

    await sendAppointmentConfirmation(
      req.user.email,
      req.user.profile?.firstName || 'there',
      {
        providerName: `${provider.userId.profile?.firstName || ''} ${provider.userId.profile?.lastName || ''}`.trim() || 'Provider',
        dateTime: appointmentDate.toISOString(),
        type,
        location: type === 'in_person' ? `${provider.practice.address.street}, ${provider.practice.address.city}` : undefined
      }
    );

    await logAction(req.user._id, 'CREATE_APPOINTMENT', 'appointment', appointment._id, { providerId, type }, req);

    const providerFullName = `${provider.userId.profile?.firstName || ''} ${provider.userId.profile?.lastName || ''}`.trim() || 'Provider';
    createAppointmentBookedNotification(req.user._id, providerFullName, appointmentDate).catch(err => console.error('[NOTIFICATION]', err));
    sendPushToUser(req.user._id, 'appointment_booked', { providerName: providerFullName }).catch(err => console.error('[PUSH]', err));

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

export const getAppointments = async (req, res, next) => {
  try {
    const { status, upcoming, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id };

    if (status) {
      query.status = status;
    }

    if (upcoming === 'true') {
      query.dateTime = { $gte: new Date() };
      query.status = { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate({
          path: 'providerId',
          populate: { path: 'userId', select: 'profile email' }
        })
        .sort({ dateTime: upcoming === 'true' ? 1 : -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Appointment.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      userId: req.user._id
    })
      .populate({
        path: 'providerId',
        populate: { path: 'userId', select: 'profile email' }
      })
      .populate('wellbeingReportId');

    if (!appointment) {
      throw new AppError('Appointment not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

export const updateAppointment = async (req, res, next) => {
  try {
    const { reason, notes } = req.body;

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404, 'NOT_FOUND');
    }

    if (appointment.status === APPOINTMENT_STATUS.COMPLETED || 
        appointment.status === APPOINTMENT_STATUS.CANCELLED) {
      throw new AppError('Cannot update completed or cancelled appointments', 400, 'INVALID_STATUS');
    }

    if (reason) appointment.reason = reason;
    if (notes) appointment.notes.userNotes = notes;
    
    await appointment.save();

    await logAction(req.user._id, 'UPDATE_APPOINTMENT', 'appointment', appointment._id, null, req);

    res.json({
      success: true,
      message: 'Appointment updated',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

export const cancelAppointment = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404, 'NOT_FOUND');
    }

    if (appointment.status === APPOINTMENT_STATUS.COMPLETED || 
        appointment.status === APPOINTMENT_STATUS.CANCELLED) {
      throw new AppError('Cannot cancel completed or already cancelled appointments', 400, 'INVALID_STATUS');
    }

    appointment.status = APPOINTMENT_STATUS.CANCELLED;
    appointment.cancellation = {
      cancelledBy: 'user',
      cancelledAt: new Date(),
      reason: reason || 'Cancelled by user'
    };
    await appointment.save();

    await logAction(req.user._id, 'CANCEL_APPOINTMENT', 'appointment', appointment._id, { reason }, req);

    const cancelProvider = await Provider.findById(appointment.providerId).populate('userId', 'profile');
    const providerName = cancelProvider ? `${cancelProvider.userId.profile?.firstName || ''} ${cancelProvider.userId.profile?.lastName || ''}`.trim() || 'Provider' : 'Provider';
    createAppointmentCancelledNotification(req.user._id, providerName, appointment.dateTime).catch(err => console.error('[NOTIFICATION]', err));
    sendPushToUser(req.user._id, 'appointment_cancelled', { providerName }).catch(err => console.error('[PUSH]', err));

    res.json({
      success: true,
      message: 'Appointment cancelled',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

export const getUpcomingAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({
      userId: req.user._id,
      dateTime: { $gte: new Date() },
      status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED] }
    })
      .populate({
        path: 'providerId',
        populate: { path: 'userId', select: 'profile' }
      })
      .sort({ dateTime: 1 });

    res.json({
      success: true,
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

export const checkPendingWithProvider = async (req, res, next) => {
  try {
    const { providerId } = req.params;

    const pendingAppointment = await Appointment.findOne({
      userId: req.user._id,
      providerId,
      status: APPOINTMENT_STATUS.PENDING
    }).select('_id status dateTime');

    res.json({
      success: true,
      data: {
        hasPending: !!pendingAppointment,
        appointment: pendingAppointment
      }
    });
  } catch (error) {
    next(error);
  }
};
