/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: HowItWorksPage.tsx
 * Module: Pages
 * Language: TypeScript React
 * Description:
 * Full How It Works page with Header and Footer.
 * ================================================================
 */

import Header from "../../../components/layout/Header";
import Footer from "../Footer";
import HowItWorks from "./HowItWorks";

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