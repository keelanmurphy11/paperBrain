import { NotePageClient } from "@/components/editor/NotePageClient";

type NotePageProps = {
  params: { noteId: string };
};

export default function NotePage({ params }: NotePageProps) {
  return <NotePageClient noteId={params.noteId} />;
}
