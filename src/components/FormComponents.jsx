import React from "react";

export const FormLabel = ({ children, required }) => (
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

export const FormInput = ({ className = "", ...props }) => (
  <input
    className={`w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all ${className}`}
    {...props}
  />
);

export const FormCheckbox = ({ label, name, checked, onChange, required }) => (
  <div className="flex items-start mb-3">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      required={required}
      className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
    />
    <label className="ml-3 text-sm text-gray-700">{label}</label>
  </div>
);

export const StepIndicator = ({ currentStep, totalSteps }) => {
  const steps = [
    { num: 1, label: "Verify" },
    { num: 2, label: "Tickets" },
    { num: 3, label: "Details" },
    { num: 4, label: "Payment" },
    { num: 5, label: "Complete" },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((step, idx) => (
          <div key={step.num} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  currentStep >= step.num
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {currentStep > step.num ? "✓" : step.num}
              </div>
              <span
                className={`text-xs mt-2 font-medium ${
                  currentStep >= step.num ? "text-blue-700" : "text-gray-500"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`h-1 flex-1 mx-2 rounded transition-all ${
                  currentStep > step.num ? "bg-blue-600" : "bg-gray-200"
                }`}
                style={{ marginTop: "-24px" }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
