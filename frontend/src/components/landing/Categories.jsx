// src/components/landing/Categories.jsx
export default function Categories() {
  const categories = [
    "Epidemiology & Surveillance",
    "Digital Health",
    "Health Systems Strengthening",
    "Maternal & Child Health",
    "Policy & Strategy",
    "Data & Evaluation",
    "Community Health",
    "Training & Capacity Building",
  ];

  return (
    <section className="bg-gray-50 py-16 px-6">
      <h2 className="text-3xl font-bold text-center text-[#1E376E] mb-12">
        Explore Focus Areas
      </h2>
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {categories.map((cat, i) => (
          <div
            key={i}
            className="bg-white shadow-md rounded-xl p-6 text-center hover:shadow-lg transition"
          >
            <div
              className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white text-lg font-bold"
              style={{
                backgroundColor: ["#357FE9", "#F7B526", "#E96435", "#1E376E"][i % 4],
              }}
            >
              {cat.charAt(0)}
            </div>
            <h3 className="mt-4 font-semibold text-[#1E376E]">{cat}</h3>
          </div>
        ))}
      </div>
    </section>
  );
}
