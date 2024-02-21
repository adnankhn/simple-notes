import { stripe } from "@/app/lib/stripe";
import { headers } from "next/headers";
import Stripe from "stripe";
import prisma from "@/app/lib/db";

import { NextApiRequest, NextApiResponse } from 'next';
var { JSDOM } = require('jsdom'); // Adjust the path as per your project structure

var { Readability } = require('@mozilla/readability');


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const url = req.query.url as string; // Get the URL from the query parameter

  try {
    const response = await fetch(url);
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

    const jsonData = {
      title:article.title,
      byline:article.byline,
      article:article.content,
      thumbnail:thumbnail,
    };

    res.status(200).json(jsonData);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching data');
  }
}
