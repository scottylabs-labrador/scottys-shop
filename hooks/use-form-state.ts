import { useState, useEffect } from "react";
import type { AnyItem } from "@/convex/constants";

interface FormState {
  title: string;
  description: string;
  price: string;
  category: string;
  condition: string;
  turnaroundDays: string;
}

const initialFormState: FormState = {
  title: "",
  description: "",
  price: "",
  category: "",
  condition: "",
  turnaroundDays: "",
};

export function useFormState(item?: AnyItem) {
  const [formData, setFormData] = useState<FormState>(initialFormState);

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || "",
        description: item.description || "",
        price: item.price?.toString() || "",
        category: item.category || "",
        condition: "condition" in item ? item.condition || "" : "",
        turnaroundDays:
          "turnaroundDays" in item ? item.turnaroundDays?.toString() || "" : "",
      });
    } else {
      setFormData(initialFormState);
    }
  }, [item]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(initialFormState);
  };

  return {
    formData,
    setFormData,
    handleInputChange,
    handleSelectChange,
    resetForm,
  };
}
