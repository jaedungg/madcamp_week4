// app/(dashboard)/editor/page.tsx
import { Suspense } from "react";
import EditorClientPage from "./EditorClientPage";

export default function EditorPage() {
  return (
    <Suspense fallback={<div>Loading editor...</div>}>
      <EditorClientPage />
    </Suspense>
  );
}
