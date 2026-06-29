import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingProjects() {
  return (
    <div className="space-y-6 p-8 md:ml-72">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-48" />)}
      </div>
    </div>
  );
}
