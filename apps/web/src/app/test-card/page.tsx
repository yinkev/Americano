import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TestCardPage() {
  return (
    <div className="p-10 bg-background">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>This is a card description.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the card content. It can be any React node.</p>
          </CardContent>
          <CardFooter>
            <Button>Action</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Another Card</CardTitle>
            <CardDescription>This one has more content.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed doeiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          </CardContent>
          <CardFooter>
            <Button variant="secondary">Secondary Action</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expressive Card</CardTitle>
            <CardDescription>This card has an expressive button.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This card is designed to draw attention to a specific action.</p>
          </CardContent>
          <CardFooter>
            <Button variant="expressive">Expressive Action</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
