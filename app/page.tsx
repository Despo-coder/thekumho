import { Meals } from "@/components/meals";
import { Hero } from "@/components/hero";
import Testimonials from "@/components/review-testimonials";
import { HowItWorks } from "@/components/how-it-works";

import { FaqSection } from "@/components/faq";
import { ChefSpotlight } from "@/components/chef";
import Subcribe from "@/components/subcribe";
import Takeout from "@/components/takeout";
import { getVerifiedTestimonials } from "@/lib/actions/review-actions";

export default async function Home() {

  const initialReviews = await getVerifiedTestimonials();
  return (

    <>

      <div >
        <Hero />
        <Meals />
        <ChefSpotlight />
        <Testimonials initialReviews={initialReviews} />
        <HowItWorks />
        <Takeout />
        <Subcribe />
        <FaqSection />
      </div>
    </>
  );
}
