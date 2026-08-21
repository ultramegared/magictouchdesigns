/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: HowItWorksPage.tsx
 * Module: Pages
 * Language: TypeScript React
 * Description:
 * Full How It Works page with global Header and Footer.
 * ================================================================
 */

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";
import HowItWorks from "../../components/home/HowItWorks/HowItWorks";

function HowItWorksPage() {
    return (
        <>
            <Header />

            <main>
                <HowItWorks />
            </main>

            <Footer />
        </>
    );
}

export default HowItWorksPage;