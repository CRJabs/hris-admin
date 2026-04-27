import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ChartSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
      </CardHeader>
      <CardContent className="h-[300px] flex items-end gap-2 pb-6">
        <Skeleton className="h-2/3 flex-1" />
        <Skeleton className="h-full flex-1" />
        <Skeleton className="h-1/2 flex-1" />
        <Skeleton className="h-3/4 flex-1" />
        <Skeleton className="h-1/3 flex-1" />
      </CardContent>
    </Card>
  );
}
