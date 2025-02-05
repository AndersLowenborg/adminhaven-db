
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const WaitingPage = () => {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Thank you for your answer</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center text-muted-foreground">
          Waiting for others to complete their responses...
        </p>
      </CardContent>
    </Card>
  );
};
