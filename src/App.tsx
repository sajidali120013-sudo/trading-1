/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Activity, Loader2, AlertCircle, TrendingUp, BarChart3, Crosshair } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [xauusdImage, setXauusdImage] = useState<string | null>(null);
  const [dxyImage, setDxyImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'xauusd' | 'dxy') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'xauusd') {
          setXauusdImage(reader.result as string);
        } else {
          setDxyImage(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeCharts = async () => {
    if (!xauusdImage || !dxyImage) {
      setError("Dono XAUUSD aur DXY charts upload karna zaroori hai.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const prompt = `
You are a "Visual Trading Intelligence AI". Your task is to analyze screenshots of XAUUSD (Gold) and DXY (Dollar Index) charts provided by the user and generate high-confluence signals based strictly on the "Core 3 + Action + DXY" strategy for a $500 account.

IMPORTANT: You MUST provide your entire analysis, reasoning, and response in ROMAN URDU (e.g., "Market abhi uptrend mein hai...").

### **STEP 1: VISUAL ANALYSIS INSTRUCTIONS**
When you receive the images, you must perform these 4 checks:
1. **Trend Identification (Baseline):** Look at XAUUSD. Are EMAs (50/200) pointing up or down? Is price making Higher Highs? (Only trade WITH the trend).
2. **Zone Mapping (Levels):** Identify clear rectangles or areas where price previously reversed (Supply/Demand) or where a 0.618 Fibonacci level might sit.
3. **Candlestick Check (Trigger):** Look for Pin Bars, Dojis, or Engulfing candles specifically at these zones on M15 or H1.
4. **DXY Multi-Screen Check (Filter):** Look at the DXY chart image. If DXY is falling, it's a GREEN LIGHT for Gold Buy. If DXY is rising, it's a GREEN LIGHT for Gold Sell.

### **STEP 2: RISK MANAGEMENT MATH ($500 ACCOUNT)**
- Standard Risk: $15 to $20 per trade.
- Lot Size Logic: 
   - 10-point SL = 0.02 Lot.
   - 15-20 point SL = 0.01 Lot.

### **STEP 3: OUTPUT FORMAT (IN ROMAN URDU)**
You must output the result in this exact format:

**[SIGNAL: BUY / SELL / NO TRADE]**
- **Current XAUUSD Price:** [Image se identify karein]
- **Entry (Buy/Sell Limit):** [Demand/Supply zone se exact level batayein]
- **SL:** [Entry se 15 points door, zone ke bahar]
- **TP1/TP2/TP3:** [1:1, 1:2, aur 1:3 targets]
- **Risk Amount:** $[Calculate karein: $15 ya $20]
- **Suggested Lot:** [0.01 ya 0.02]
- **Max Loss @ SL:** $[Risk ke barabar hona chahiye]
- **DXY Confluence:** [DXY chart par kya nazar aa raha hai? Detail mein Roman Urdu mein samjhayein]

### **STEP 4: GUARDRAILS**
- Agar image blur hai ya levels clear nahi hain, toh likhein "UNCLEAR DATA - NO TRADE".
- Agar time 1:00 PM – 9:00 PM PKT ke bahar hai, toh isko "PRE-MARKET SETUP" label karein.
- Kabhi bhi 'market execution' suggest na karein agar price zone se door hai. Hamesha 'Limit Entries' ko prefer karein.
- Pura jawab Roman Urdu mein hona chahiye taake user ko asani se samajh aa sake.
      `;

      const getInlineData = (dataUrl: string) => {
        const [header, base64] = dataUrl.split(',');
        const mimeType = header.split(':')[1].split(';')[0];
        return {
          inlineData: {
            mimeType,
            data: base64,
          }
        };
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: {
          parts: [
            { text: "Yeh XAUUSD ka chart hai:" },
            getInlineData(xauusdImage),
            { text: "Yeh DXY ka chart hai:" },
            getInlineData(dxyImage),
            { text: prompt }
          ]
        }
      });

      setResult(response.text || "Koi analysis generate nahi ho saka.");
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(err.message || "Analysis ke dauran ek masla pesh aaya.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-200 font-sans selection:bg-emerald-500/30">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-[#0B0E14]/80 backdrop-blur-md border-b border-white/5 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <Activity className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-none">Trading AI</h1>
              <p className="text-[10px] sm:text-xs text-emerald-400/80 mt-1 font-mono uppercase tracking-wider">Core 3 + Action + DXY</p>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Left Column: Uploads */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-5 space-y-5"
          >
            <div className="bg-[#151A23] rounded-2xl p-5 sm:p-6 border border-white/5 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  XAUUSD Chart
                </h2>
                <span className="text-xs font-mono text-slate-500 bg-slate-800/50 px-2 py-1 rounded-md">STEP 1</span>
              </div>
              <ImageUploadZone 
                image={xauusdImage} 
                onUpload={(e) => handleImageUpload(e, 'xauusd')} 
                label="Gold ka chart yahan upload karein"
                accentColor="hover:border-amber-500/50"
              />
            </div>

            <div className="bg-[#151A23] rounded-2xl p-5 sm:p-6 border border-white/5 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  DXY Chart
                </h2>
                <span className="text-xs font-mono text-slate-500 bg-slate-800/50 px-2 py-1 rounded-md">STEP 2</span>
              </div>
              <ImageUploadZone 
                image={dxyImage} 
                onUpload={(e) => handleImageUpload(e, 'dxy')} 
                label="Dollar Index chart yahan upload karein"
                accentColor="hover:border-blue-500/50"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400 mt-4">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={analyzeCharts}
              disabled={isAnalyzing || !xauusdImage || !dxyImage}
              className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 disabled:border-transparent border border-emerald-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:shadow-none cursor-pointer active:scale-[0.98]"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Market Analyze ho rahi hai...
                </>
              ) : (
                <>
                  <Crosshair className="w-5 h-5" />
                  Trading Signal Generate Karein
                </>
              )}
            </button>
          </motion.div>

          {/* Right Column: Results */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-7"
          >
            <div className="bg-[#151A23] rounded-2xl p-5 sm:p-8 border border-white/5 shadow-2xl flex flex-col h-full min-h-[500px] lg:min-h-[calc(100vh-8rem)] relative overflow-hidden">
              
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-5 relative z-10">
                <Activity className="w-5 h-5 text-emerald-400" />
                AI Analysis Result
              </h2>
              
              <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar pr-2">
                {result ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="prose prose-invert prose-emerald max-w-none prose-headings:text-white prose-a:text-emerald-400 prose-strong:text-emerald-300 text-slate-300 prose-p:leading-relaxed prose-li:marker:text-emerald-500"
                  >
                    <Markdown>{result}</Markdown>
                  </motion.div>
                ) : isAnalyzing ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-6 py-20">
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
                      <Loader2 className="w-12 h-12 animate-spin text-emerald-400 relative z-10" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-lg font-medium text-white">Data Process ho raha hai...</p>
                      <p className="text-sm">Trend, Zones aur DXY confluence check ki ja rahi hai.</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-5 py-20">
                    <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center border border-white/5">
                      <Crosshair className="w-8 h-8 text-slate-600" />
                    </div>
                    <div className="text-center max-w-sm space-y-2">
                      <p className="text-lg font-medium text-slate-300">Ready for Analysis</p>
                      <p className="text-sm leading-relaxed">Dono charts upload karein aur button dabayein taake AI aapko Roman Urdu mein detailed signal de sake.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}

function ImageUploadZone({ 
  image, 
  onUpload, 
  label,
  accentColor
}: { 
  image: string | null; 
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  accentColor: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div 
      onClick={() => fileInputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-all duration-300 group ${
        image 
          ? 'border-white/10 bg-[#0B0E14]' 
          : `border-white/10 bg-[#0B0E14]/50 hover:bg-[#0B0E14] ${accentColor}`
      }`}
    >
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={onUpload}
        accept="image/*"
        className="hidden" 
      />
      
      {image ? (
        <div className="relative aspect-video w-full">
          <img src={image} alt="Uploaded chart" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
            <p className="text-white font-medium flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg border border-white/20">
              <Upload className="w-4 h-4" /> Image Tabdeel Karein
            </p>
          </div>
        </div>
      ) : (
        <div className="aspect-video w-full flex flex-col items-center justify-center text-slate-400 p-6 text-center space-y-4">
          <div className="p-4 bg-white/5 rounded-full group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300">
            <ImageIcon className="w-6 h-6 text-slate-300" />
          </div>
          <div>
            <p className="font-medium text-slate-300 text-sm sm:text-base">{label}</p>
            <p className="text-xs text-slate-500 mt-1.5">Click karein ya image drag karein</p>
          </div>
        </div>
      )}
    </div>
  );
}
