import Header from '../components/Header'
import Footer from '../components/Footer'
import CustomCursor from '../components/CustomCursor'
import HeroSection from '../sections/HeroSection'
import BrandMarquee from '../sections/BrandMarquee'
import CarCatalog from '../sections/CarCatalog'
import PaintDripDivider from '../sections/PaintDripDivider'
import FeaturedCar from '../sections/FeaturedCar'
import WhyChooseUs from '../sections/WhyChooseUs'
import Testimonials from '../sections/Testimonials'
import CTASection from '../sections/CTASection'

export default function Home() {
  return (
    <>
      <CustomCursor />
      <Header />
      <main>
        <HeroSection />
        <BrandMarquee />
        <CarCatalog />
        <PaintDripDivider />
        <FeaturedCar />
        <WhyChooseUs />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
