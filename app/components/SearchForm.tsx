// components/SearchForm.js
"use client"
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SearchForm({ onSubmit }) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit(searchQuery);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="gap-y-2 flex flex-col">
        <Label>URL</Label>
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for your note"
        />
      </div>
      <button type="submit">Search</button>
    </form>
  );
}
