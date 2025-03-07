import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface ErrorStateProps {
  error: string;
  onBackClick: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onBackClick }) => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <Button
        variant="ghost"
        className="mb-6 flex items-center gap-2"
        onClick={onBackClick}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Messages
      </Button>
      <div className="text-center py-10 bg-gray-50 rounded-lg border">
        <p className="text-red-500">{error}</p>
        <Button onClick={onBackClick} className="mt-4">
          Return to Messages
        </Button>
      </div>
    </div>
  );
};

export default ErrorState;
