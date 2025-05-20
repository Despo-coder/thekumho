import { Meals } from "@/components/meals";
import { Hero } from "@/components/hero";
import { Testimonials } from "@/components/testimonials";
import { HowItWorks } from "@/components/how-it-works";

import { FaqSection } from "@/components/faq";
import { ChefSpotlight } from "@/components/chef";
import Subcribe from "@/components/subcribe";

export default function Home() {
  return (

    <>

      <div >
        <Hero />
        <Meals />
        <ChefSpotlight />
        <Testimonials />
        <HowItWorks />
        <Subcribe />
        <FaqSection />
      </div>
    </>
  );
}
