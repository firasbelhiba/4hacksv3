'use client';

import { HackathonWizard } from '@/components/hackathons/wizard/hackathon-wizard';

export default function NewHackathonPage() {
  return (
    <div className="container mx-auto py-8">
      <HackathonWizard mode="create" />
    </div>
  );
}