import { demoLogin } from "@/app/actions";
import { Button, Card, PageHeader } from "@/components/ui";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Demo Login" description="Use the demo session to access the CareOps AI workflow screens." />
      <Card>
        <form action={demoLogin} className="space-y-4">
          <div>
            <p className="text-sm font-medium">care.coordinator@example.com</p>
            <p className="mt-1 text-sm text-muted-foreground">Lightweight demo login. Production auth is intentionally out of scope for this prototype.</p>
          </div>
          <Button type="submit">Enter demo</Button>
        </form>
      </Card>
    </div>
  );
}

