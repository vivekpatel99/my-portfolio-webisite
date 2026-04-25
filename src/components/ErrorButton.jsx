import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

const ErrorButton = () => {
  const handleClick = () => {
    throw new Error('Sentry Test Error: This is a manually triggered test error.');
  };

  return (
    <div className="flex justify-center py-8">
      <Button variant="destructive" onClick={handleClick} className="flex items-center gap-2">
        <AlertTriangle size={18} />
        Throw Test Error
      </Button>
    </div>
  );
};

export default ErrorButton;
