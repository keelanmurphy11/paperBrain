import { FolderView } from "@/components/layout/FolderView";

type FolderPageProps = {
  params: { folderId: string };
};

export default function FolderPage({ params }: FolderPageProps) {
  return <FolderView folderId={params.folderId} />;
}
