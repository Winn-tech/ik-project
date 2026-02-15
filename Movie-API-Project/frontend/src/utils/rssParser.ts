import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  creator?: string;
  content?: string;
  contentSnippet?: string;
  categories?: string[];
  source: string;
  sourceIcon?: string;
  image?: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

// Function to decode HTML entities properly
const decodeHtmlEntities = (text: string): string => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

// Function to extract image from content if available
const extractImage = (content: string): string | undefined => {
  const imgRegex = /<img[^>]+src="([^">]+)"/;
  const match = content.match(imgRegex);
  return match ? match[1] : undefined;
};

// Function to clean HTML and create a snippet
const createContentSnippet = (content: string): string => {
  // First decode HTML entities
  let decodedContent = decodeHtmlEntities(content);
  
  // Replace HTML tags with spaces
  let snippet = decodedContent.replace(/<[^>]*>/g, ' ');
  
  // Replace multiple spaces with a single space
  snippet = snippet.replace(/\s{2,}/g, ' ');
  
  // Trim and limit length
  snippet = snippet.trim().slice(0, 250) + (snippet.length > 250 ? '...' : '');
  
  return snippet;
};

// Proxy URL to avoid CORS issues
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

export const fetchRssFeed = async (feedUrl: string, sourceName: string, sourceIcon?: string): Promise<NewsItem[]> => {
  try {
    const response = await axios.get(`${CORS_PROXY}${encodeURIComponent(feedUrl)}`, {
      headers: { 'Content-Type': 'text/xml' }
    });
    
    const result = parser.parse(response.data);
    const channel = result.rss?.channel || {};
    const items = channel.item || [];
    
    if (!items || items.length === 0) {
      return [];
    }
    
    return (Array.isArray(items) ? items : [items]).map((item: any, index: number) => {
      // Decode HTML entities in title and other text fields
      const title = decodeHtmlEntities(item.title || 'No Title');
      let content = item['content:encoded'] || item.description || '';
      
      let image = item['media:content']?.['@_url'] || item.enclosure?.['@_url'];
      
      if (!image && content) {
        image = extractImage(content);
      }

      // Create a content snippet with properly cleaned text
      const contentSnippet = createContentSnippet(content);
      
      // Normalize categories to always be an array and decode them
      let categories = [];
      if (item.category) {
        categories = Array.isArray(item.category) 
          ? item.category.map(decodeHtmlEntities)
          : [decodeHtmlEntities(item.category)];
      }
      
      // Decode creator name if present
      const creator = item['dc:creator'] 
        ? decodeHtmlEntities(item['dc:creator'])
        : decodeHtmlEntities(channel.title || sourceName);
      
      return {
        id: `${sourceName}-${index}-${Date.now()}`,
        title,
        link: item.link || '',
        pubDate: item.pubDate || item['dc:date'] || new Date().toUTCString(),
        creator,
        content,
        contentSnippet,
        categories,
        image,
        source: sourceName,
        sourceIcon
      };
    });
  } catch (error) {
    console.error(`Error fetching RSS feed from ${sourceName}:`, error);
    return [];
  }
};
