// app/docs/page.tsx
'use client';

import dynamic from 'next/dynamic';

const SwaggerUI: any = dynamic(() => import('swagger-ui-react'), { ssr: false });
import 'swagger-ui-react/swagger-ui.css';

export default function DocsPage() {
  return (
    <div style={{ height: '100vh' }}>
      <SwaggerUI url="/swagger.json" />
    </div>
  );
}
