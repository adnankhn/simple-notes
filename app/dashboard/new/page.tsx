import { SubmitButton } from "@/app/components/Submitbuttons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import prisma from "@/app/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
var { Readability } = require('@mozilla/readability');
var { JSDOM } = require('jsdom'); // Adjust the path as per your project structure
import DOMPurify from 'dompurify'; // Import DOMPurify for HTML sanitization

export default async function NewNoteRoute() {
  noStore();
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  let jsonData = null;


  async function postData(formData: FormData) {
    "use server";

    if (!user) {
      throw new Error("Not authorized");
    }

    // const title = formData.get("title") as string;
    // const description = formData.get("description") as string;
    const url = formData.get("url") as string; // Retrieve URL from form data

    // Function to fetch data from URL using Readability
    async function fetchDataFromUrl(url: string) {
      const response = await fetch(`${url}`, {
        headers: {
          'origin': process.env.PRODUCTION_SERVER_URL as string, // Use http://localhost as the origin
        },
      });
      const html = await response.text();
      const doc = new JSDOM(html, { url: url });
      
      const reader = new Readability(doc.window.document);
      const article = reader.parse();

      let thumbnail = null;

      // Check for lead image URL in article content
      const contentDoc = new JSDOM(article.content).window.document;
      const leadImage = contentDoc.querySelector('img');
      if (leadImage) {
        thumbnail = leadImage.src;
      }

      // Check metadata for thumbnail image URL
      const metaTags = doc.window.document.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]');
      if (metaTags.length > 0) {
        thumbnail = metaTags[0].getAttribute('content');
      }
    
      return {
        title: article.title,
        byline: article.byline,
        content: article.content,
        thumbnail : thumbnail
        // You can include additional fields from the article object if needed
      };
    }

    
    // Fetch data from URL and store it in jsonData field
    const jsonData = await fetchDataFromUrl(url);

    const newNote = await prisma.note.create({
      data: {
        userId: user?.id,
        // description: description,
        title: jsonData.title,
        url: url,
        jsonData: jsonData, // Store fetched data in jsonData field
      },
    });

    return redirect(`/dashboard/new/${newNote.id}`);
    // return redirect("/dashboard");
    
  }

  
  return (
    <Card>
      <form action={postData}>
        <CardHeader>
          <CardTitle>New Link</CardTitle>
          <CardDescription>
            Right here you can now create your new notes
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-y-5">
          {/* <div className="gap-y-2 flex flex-col">
            <Label>Title</Label>
            <Input
              // required
              type="text"
              name="title"
              placeholder="Title for your note"
            />
          </div> */}

          <div className="gap-y-2 flex flex-col">
            {/* Add a URL field */}
            <Label>URL</Label>
            <Input
              type="url"
              name="url"
              placeholder="URL for your note"
            />
          </div>

          {/* <div className="flex flex-col gap-y-2">
            <Label>Description</Label>
            <Textarea
              name="description"
              placeholder="Describe your note as you want"
            />
          </div> */}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button asChild variant="destructive">
            <Link href="/dashboard">Cancel</Link>
          </Button>
          <SubmitButton />
        </CardFooter>
      </form>

      {jsonData && (
        <Card>
          <CardHeader>
            <CardTitle>Fetched Data</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add relevant fields from jsonData here, e.g., */}
            <p>Title: {jsonData.title}</p>
            <p>Byline: {jsonData.byline}</p>
            <div dangerouslySetInnerHTML={{ __html: jsonData.content }} /> // Consider safer alternatives for user-generated content
          </CardContent>
        </Card>
      )}
    </Card>
  );
}
