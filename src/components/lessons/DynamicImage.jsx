import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader2 } from 'lucide-react';

export default function DynamicImage({ keyword }) {
  const [imgUrl, setImgUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [description, setDescription] = useState('');

  useEffect(() => {
    let isMounted = true;
    
    async function fetchImage() {
      if (!keyword) return;
      try {
        setLoading(true);
        // Step 1: Search Wikipedia for the page related to the keyword
        const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(keyword)}&utf8=&format=json&origin=*`);
        const searchData = await searchRes.json();
        
        if (searchData.query.search.length > 0) {
          const pageTitle = searchData.query.search[0].title;
          
          // Step 2: Get the main image of the page
          const imgRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&format=json&pithumbsize=1000&origin=*`);
          const imgData = await imgRes.json();
          
          const pages = imgData.query.pages;
          const pageId = Object.keys(pages)[0];
          
          if (pages[pageId] && pages[pageId].thumbnail) {
            if (isMounted) {
              setImgUrl(pages[pageId].thumbnail.source);
              setDescription(pageTitle);
              setLoading(false);
            }
          } else {
            throw new Error("No image found on the Wikipedia page.");
          }
        } else {
          throw new Error("No Wikipedia page found for this keyword.");
        }
      } catch (err) {
        console.error("Failed to fetch image from Wikipedia:", err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    }
    
    fetchImage();
    
    return () => {
      isMounted = false;
    };
  }, [keyword]);

  if (error) {
    return null; // Silently fail and don't break the layout if image wasn't found
  }

  return (
    <div className="my-8 rounded-2xl overflow-hidden bg-surface-container border border-outline-variant shadow-lg relative group">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
          <p className="text-sm font-medium">Поиск иллюстрации...</p>
        </div>
      ) : (
        <div className="relative">
          <img 
            src={imgUrl} 
            alt={description} 
            className="w-full max-h-[500px] object-cover object-center"
            loading="lazy"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12 opacity-0 group-hover:opacity-100 transition-opacity">
             <div className="flex items-center gap-2 text-white/90 text-xs font-medium">
               <ImageIcon className="w-4 h-4" />
               <span>Иллюстрация: {description} (Источник: Wikipedia)</span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
