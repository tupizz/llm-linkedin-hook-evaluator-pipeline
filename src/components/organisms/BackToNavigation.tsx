import React from 'react';
import { List, ArrowUp } from 'lucide-react';
import { Card, Button } from '../atoms';
import { ScrollUtils } from '@/hooks/useScrollUtils';

interface BackToNavigationProps {
  scrollUtils: ScrollUtils;
}

export const BackToNavigation: React.FC<BackToNavigationProps> = ({
  scrollUtils,
}) => {
  return (
    <Card variant="glass">
      <div className="flex items-center justify-center space-x-6">
        <Button
          onClick={() => scrollUtils.scrollToSection('table-of-contents')}
          variant="primary"
          icon={List}
        >
          Back to Navigation
        </Button>
        <Button
          onClick={scrollUtils.scrollToTop}
          variant="ghost"
          icon={ArrowUp}
        >
          Back to Top
        </Button>
      </div>
    </Card>
  );
};