import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="card-surface">
      <EmptyState
        icon={Compass}
        title="That page does not exist"
        description="The link may be out of date, or the record it pointed at was deleted."
        action={{ label: 'Go to the overview', onClick: () => navigate('/') }}
      />
    </div>
  );
}
