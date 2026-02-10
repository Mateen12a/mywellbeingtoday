// src/components/landing/CTA.jsx
import { Link } from "react-router-dom";

export default function CTA() {
  return (
    <section className="bg-[#1E376E] text-white text-center py-16 px-6">
      <h2 className="text-3xl font-bold mb-6">Ready to Join GlobalHealth.Works?</h2>
      <p className="max-w-2xl mx-auto mb-8 text-gray-200">
        Post a task. Solve a task. Together, let’s make global health work.
      </p>
      <div className="flex justify-center gap-4">
        <Link
          to="/signup?role=TO"
          className="bg-[#E96435] px-6 py-3 rounded-lg font-semibold hover:bg-orange-700"
        >
          Post a Task
        </Link>
        <Link
          to="/signup?role=SP"
          className="bg-[#357FE9] px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
        >
          Become a Solution Provider
        </Link>
      </div>
    </section>
  );
}
