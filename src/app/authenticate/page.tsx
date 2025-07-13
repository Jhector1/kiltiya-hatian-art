
'use client'
import AuthenticationForm from '@/components/authenticate/AuthenticationFom';
import SEO from '@/components/SEO';

export default function AuthToggle() {


  return (
   <>
         <SEO
           title="Haitian Digital Art Gallery"
           description="Buy and explore uniquely crafted Haitian vector artworks."
         />
         <AuthenticationForm/>
  
       </>
  );
}
