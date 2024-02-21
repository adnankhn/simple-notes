import { Button } from "@/components/ui/button";
import Link from "next/link";
import prisma from "../lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { Edit, File, Trash } from "lucide-react";
import { Card } from "@/components/ui/card";

import { TrashDelete, SearchButton } from "../components/Submitbuttons";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
async function getData(userId: string) {
  noStore();
  const data = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      Notes: {
        select: {
          title: true,
          id: true,
          description: true,
          jsonData:true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },

      Subscription: {
        select: {
          status: true,
        },
      },
    },
  });

  return data;
}

async function SearchData(formData: FormData) {
  "use server";

  // noStore();
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  console.log(user?.id);


  const searchQuery = formData.get("search") as string; // Retrieve URL from form data
  console.log(searchQuery);
  const data = await prisma.user.findUnique({
    where: {
      id: user?.id,
    },
    select: {
      Notes: {
        where: {
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } }, // Match title containing search query
            { description: { contains: searchQuery, mode: 'insensitive' } }, // Match description containing search query
            // { jsonData: { contains: searchQuery, mode: 'insensitive' } }, // Match jsonData containing search query
          ],
        },
        select: {
          title: true,
          id: true,
          description: true,
          jsonData: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      Subscription: {
        select: {
          status: true,
        },
      },
    },
  });
  console.log(data);

  return data;
}


export default async function DashboardPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  console.log(user?.id);

  const data = await getData(user?.id as string);

  async function deleteNote(formData: FormData) {
    "use server";

    const noteId = formData.get("noteId") as string;

    await prisma.note.delete({
      where: {
        id: noteId,
      },
    });

    revalidatePath("/dasboard");
  }
  return (
    
    <div className="grid items-start gap-y-8">
      {/* temp div submit */}
      <form action={SearchData}>
      <div className="gap-y-2 flex flex-col">
        
            {/* Add a URL field */}
            <Label>URL</Label>
            <Input
              type="text"
              name="search"
              placeholder="Search for your note"
            />
          </div>
          <SearchButton />
          </form>

      {/* temp div submit */}

      <div className="flex items-center justify-between px-2">
        <div className="grid gap-1">
          <h1 className="text-3xl md:text-4xl">Your Collection</h1>
          <p className="text-lg text-muted-foreground">
            Here you can see and save new URLs
          </p>
        </div>

        {data?.Subscription?.status === "active" ? (
          <Button asChild>
            <Link href="/dashboard/new">Save new URL</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href="/dashboard/billing">Create a new Note</Link>
          </Button>
        )}
      </div>

      {data?.Notes.length == 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <File className="w-10 h-10 text-primary" />
          </div>

          <h2 className="mt-6 text-xl font-semibold">
            You dont have any notes created
          </h2>
          <p className="mb-8 mt-2 text-center text-sm leading-6 text-muted-foreground max-w-sm mx-auto">
            You currently dont have any notes. please create some so that you
            can see them right here.
          </p>

          {data?.Subscription?.status === "active" ? (
            <Button asChild>
              <Link href="/dashboard/new">Create a new Note</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/dashboard/billing">Create a new Note</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-7 ">
          {data?.Notes.map((item) => (
            <Card
              key={item.id}
              className="flex items-center justify-between p-4"
            >
              <div className="w-full relative">
              {item.jsonData && item.jsonData.thumbnail && (
    <img src={item.jsonData.thumbnail} alt="Thumbnail" className="w-full rounded-t-lg aspect-video object-cover" />
  )}          
              <div className="p-3">
                <h2 className="font-semibold text-xl text-primary">
                  {item.title}
                </h2>
                <p>
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "full",
                  }).format(new Date(item.createdAt))}
                </p>
              </div>

              <div className="flex gap-x-4">
                <Link href={`/dashboard/new/${item.id}`}>
                  <Button variant="outline" size="icon">
                    <Edit className="w-4 h-4" />
                  </Button>
                </Link>
                <form action={deleteNote}>
                  <input type="hidden" name="noteId" value={item.id} />
                  <TrashDelete />
                </form>
              </div>

              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------

// "use client"
// import { useState, useEffect } from 'react';
// import { Button } from "@/components/ui/button";
// import Link from "next/link";
// import { Edit, File } from "lucide-react";
// import { Card } from "@/components/ui/card";
// import { TrashDelete, SearchButton } from "../components/Submitbuttons";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import prisma from "../lib/db";

// async function fetchData(userId: string) {
//   const data = await prisma.user.findUnique({
//     where: {
//       id: userId,
//     },
//     select: {
//       Notes: {
//         select: {
//           title: true,
//           id: true,
//           description: true,
//           jsonData: true,
//           createdAt: true,
//         },
//         orderBy: {
//           createdAt: "desc",
//         },
//       },
//       Subscription: {
//         select: {
//           status: true,
//         },
//       },
//     },
//   });
//   console.log(data);
//   return data;
// }

// async function searchNotes(searchQuery: string) {
//   const response = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`);
//   if (!response.ok) {
//     throw new Error('Failed to search notes');
//   }
//   return await response.json();
// }

// export default function DashboardPage() {
//   console.log("Rendering DashboardPage...");

  

//   useEffect(() => {
//     const fetchDataAsync = async () => {
//       console.log("Fetching data...");
//       try {
//         const userData = await fetchData('kp_b6a6a1e7cc5e4b73b091c440616dbce2');
//         setData(userData);
//       } catch (error) {
//         console.error("Error fetching data:", error);
//       }
//     };
  
//     fetchDataAsync();
//   }, []); // Empty dependency array to run the effect only once on component mount
//    // Empty dependency array to run the effect only once on component mount
//    const [data, setData] = useState(null);
//    const [searchQuery, setSearchQuery] = useState('');
//   async function fetchData(userId: string) {
//     const data = await prisma.user.findUnique({
//       where: {
//         id: userId,
//       },
//       select: {
//         Notes: {
//           select: {
//             title: true,
//             id: true,
//             description: true,
//             jsonData: true,
//             createdAt: true,
//           },
//           orderBy: {
//             createdAt: "desc",
//           },
//         },
//         Subscription: {
//           select: {
//             status: true,
//           },
//         },
//       },
//     });
//     console.log("Fetched data:", data);
//     return data;
//   }

//   async function searchNotes(searchQuery: string) {
//     console.log("Searching notes...");
//     const response = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`);
//     if (!response.ok) {
//       throw new Error('Failed to search notes');
//     }
//     return await response.json();
//   }

//   async function handleSearch(event) {
//     event.preventDefault();
//     try {
//       const searchData = await searchNotes(searchQuery);
//       setData(searchData);
//     } catch (error) {
//       console.error("Error searching notes:", error);
//     }
//   }

//   return (
//     <div className="grid items-start gap-y-8">
//       <form onSubmit={handleSearch}>
//         <div className="gap-y-2 flex flex-col">
//           <Label>URL</Label>
//           <Input
//             type="text"
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             placeholder="Search for your note"
//           />
//         </div>
//         <SearchButton />
//       </form>

//       {/* Render user data */}
//       {/* Add conditional rendering based on data presence */}
//     </div>
//   );
// }

// -------------------------------------------------------




// // pages/dashboard.tsx
// "use client"
// import { useState, useEffect } from 'react';
// import { Button } from "@/components/ui/button";
// import Link from "next/link";
// import prisma from "../lib/db";
// import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
// import { Edit, File } from "lucide-react";
// import { Card } from "@/components/ui/card";
// import { TrashDelete } from "../components/Submitbuttons";
// import { revalidatePath } from "next/cache";
// import SearchForm from '../components/SearchForm';

// async function getData(userId: string) {
//   const data = await prisma.user.findUnique({
//     where: {
//       id: userId,
//     },
//     select: {
//       Notes: {
//         select: {
//           title: true,
//           id: true,
//           description: true,
//           jsonData: true,
//           createdAt: true,
//         },
//         orderBy: {
//           createdAt: "desc",
//         },
//       },
//       Subscription: {
//         select: {
//           status: true,
//         },
//       },
//     },
//   });

//   return data;
// }

// async function searchNotes(userId: string, searchQuery: string) {
//   const data = await prisma.user.findUnique({
//     where: {
//       id: userId,
//     },
//     select: {
//       Notes: {
//         where: {
//           OR: [
//             { title: { contains: searchQuery, mode: 'insensitive' } },
//             { description: { contains: searchQuery, mode: 'insensitive' } },
//           ],
//         },
//         select: {
//           title: true,
//           id: true,
//           description: true,
//           jsonData: true,
//           createdAt: true,
//         },
//         orderBy: {
//           createdAt: "desc",
//         },
//       },
//       Subscription: {
//         select: {
//           status: true,
//         },
//       },
//     },
//   });

//   return data;
// }

// async function deleteNote(noteId: string) {
//   await prisma.note.delete({
//     where: {
//       id: noteId,
//     },
//   });
//   revalidatePath("/dashboard");
// }

// export default function DashboardPage() {
//   const { getUser } = getKindeServerSession();
//   const [initialData, setInitialData] = useState(null);
//   const [filteredData, setFilteredData] = useState(null);

//   useEffect(() => {
//     async function fetchData() {
//       const user = await getUser();
//       const userData = await getData(user?.id);
//       setInitialData(userData);
//       setFilteredData(userData);
//     }
//     fetchData();
//   }, []);

//   const handleSearch = async (searchQuery) => {
//     const user = await getUser();
//     const searchData = await searchNotes(user?.id, searchQuery);
//     setFilteredData(searchData);
//   };

//   const handleDeleteNote = async (noteId) => {
//     await deleteNote(noteId);
//     const user = await getUser();
//     const userData = await getData(user?.id);
//     setInitialData(userData);
//     setFilteredData(userData);
//   };

//   return (
//     <div className="grid items-start gap-y-8">
//       <SearchForm onSubmit={handleSearch} />
//       {filteredData && (
//         <div>
//           {/* Render filtered data here */}
//         </div>
//       )}
//     </div>
//   );
// }
