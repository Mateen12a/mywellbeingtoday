import { Router } from 'express';
import * as certificateController from '../controllers/certificateController.js';
import { authenticate, isProvider } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', certificateController.getCertificates);
router.get('/:id', certificateController.getCertificate);
router.post('/', isProvider, certificateController.createCertificate);
router.post('/ai-suggest', isProvider, certificateController.getCertificateSuggestion);
router.patch('/:id', certificateController.updateCertificate);
router.delete('/:id', certificateController.deleteCertificate);

export default router;
