import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingPortal() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-8">
      <Skeleton className="h-12 w-72" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-56" />)}
      </div>
    </div>
  );
}
