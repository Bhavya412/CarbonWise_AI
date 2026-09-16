import React, { useState, useEffect } from 'react';
import {
  Leaf,
  Activity,
  Sliders,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Sparkles,
  RefreshCw,
  Send,
  HelpCircle,
  Award,
  ChevronRight,
  ChevronLeft,
  Info,
  Car,
  Plane,
  Home,
  Utensils,
  ShoppingBag,
  Zap,
  RotateCcw,
  Check,
  ShieldCheck,
  Globe
} from 'lucide-react';
import {
  predictEmission,
  simulateScenario,
  fetchMetrics,
  fetchFeatureImportances,
  askAssistant,
  fetchHealth
} from './services/api';

const DEFAULT_FORM_DATA = {
  body_type: 'normal',
  sex: 'female',
  diet: 'omnivore',
  how_often_shower: 'daily',
  heating_energy_source: 'electricity',
  transport: 'public',
  vehicle_type: 'Not Applicable',
  social_activity: 'sometimes',
  monthly_grocery_bill: 180,
  frequency_of_traveling_by_air: 'rarely',
  vehicle_monthly_distance_km: 300,
  waste_bag_size: 'medium',
  waste_bag_weekly_count: 3,
  how_long_tv_pc_daily_hour: 8,
  how_many_new_clothes_monthly: 10,
  how_long_internet_daily_hour: 6,
  energy_efficiency: 'Yes',
  recycling: ['Paper', 'Plastic'],
  cooking_with: ['Stove', 'Oven', 'Microwave']
};

export default function App() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'assessment' | 'scenario' | 'assistant' | 'methodology'
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [predictionResult, setPredictionResult] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Scenario state
  const [scenarioData, setScenarioData] = useState(DEFAULT_FORM_DATA);
  const [scenarioResult, setScenarioResult] = useState(null);
  const [loadingScenario, setLoadingScenario] = useState(false);

  // Metrics & Features
  const [metrics, setMetrics] = useState(null);
  const [featureImportances, setFeatureImportances] = useState(null);
  const [apiOnline, setApiOnline] = useState(true);

  // Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'assistant',
      text: 'Welcome to CarbonWise Guide! Ask me any question about your carbon footprint, lifestyle adjustments, or general sustainability advice.'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    checkBackendHealth();
    loadMetricsAndFeatures();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const res = await fetchHealth();
      setApiOnline(res.status === 'ok');
    } catch {
      setApiOnline(false);
    }
  };

  const loadMetricsAndFeatures = async () => {
    try {
      const [mRes, fRes] = await Promise.all([fetchMetrics(), fetchFeatureImportances()]);
      setMetrics(mRes);
      setFeatureImportances(fRes);
    } catch (e) {
      console.warn('Backend metrics not available yet:', e);
    }
  };

  // Sync scenarioData whenever formData or predictionResult changes
  useEffect(() => {
    setScenarioData({ ...formData });
  }, [formData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'transport' && value !== 'private') {
        updated.vehicle_type = 'Not Applicable';
      } else if (field === 'transport' && value === 'private' && updated.vehicle_type === 'Not Applicable') {
        updated.vehicle_type = 'petrol';
      }
      return updated;
    });
  };

  const handleScenarioChange = (field, value) => {
    setScenarioData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'transport' && value !== 'private') {
        updated.vehicle_type = 'Not Applicable';
      } else if (field === 'transport' && value === 'private' && updated.vehicle_type === 'Not Applicable') {
        updated.vehicle_type = 'petrol';
      }
      return updated;
    });
  };

  const handleArrayToggle = (field, item, isScenario = false) => {
    const setter = isScenario ? setScenarioData : setFormData;
    setter(prev => {
      const currentArr = prev[field] || [];
      const exists = currentArr.includes(item);
      const updated = exists ? currentArr.filter(x => x !== item) : [...currentArr, item];
      return { ...prev, [field]: updated };
    });
  };

  const handleSubmitPrediction = async (e) => {
    e?.preventDefault();
    setLoadingPrediction(true);
    setErrorMsg(null);
    try {
      const res = await predictEmission(formData);
      setPredictionResult(res);
      setScenarioData({ ...formData });
      setActiveTab('results');
    } catch (err) {
      setErrorMsg(err.message || 'Unable to calculate footprint prediction.');
    } finally {
      setLoadingPrediction(false);
    }
  };

  const handleRunScenario = async () => {
    setLoadingScenario(true);
    try {
      const res = await simulateScenario(formData, scenarioData);
      setScenarioResult(res);
    } catch (err) {
      alert('Unable to simulate scenario: ' + err.message);
    } finally {
      setLoadingScenario(false);
    }
  };

  const applyScenarioPreset = (presetType) => {
    let preset = { ...formData };
    if (presetType === 'eco_commuter') {
      preset.transport = 'public';
      preset.vehicle_type = 'Not Applicable';
      preset.vehicle_monthly_distance_km = 100;
      preset.frequency_of_traveling_by_air = 'rarely';
    } else if (presetType === 'clean_energy') {
      preset.heating_energy_source = 'electricity';
      preset.energy_efficiency = 'Yes';
      preset.diet = 'vegetarian';
    } else if (presetType === 'zero_waste') {
      preset.waste_bag_weekly_count = 1;
      preset.waste_bag_size = 'small';
      preset.recycling = ['Paper', 'Plastic', 'Glass', 'Metal'];
      preset.how_many_new_clothes_monthly = 2;
    }
    setScenarioData(preset);
  };

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || chatInput;
    if (!textToSend.trim() || chatLoading) return;

    const newMsgs = [...chatMessages, { sender: 'user', text: textToSend }];
    setChatMessages(newMsgs);
    if (!customText) setChatInput('');
    setChatLoading(true);

    try {
      const ctx = predictionResult ? {
        predicted_emission: predictionResult.predicted_carbon_emission,
        top_factors: predictionResult.top_factors.map(f => f.feature).join(', ')
      } : null;

      const res = await askAssistant(textToSend, ctx);
      setChatMessages([...newMsgs, { sender: 'assistant', text: res.answer }]);
    } catch (err) {
      setChatMessages([
        ...newMsgs,
        {
          sender: 'assistant',
          text: 'Your AI guide is temporarily unavailable. Your footprint analysis remains active.'
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Helper for footprint benchmark level
  const getFootprintLevel = (score) => {
    if (score < 1500) return { label: 'Low Impact', class: 'level-low', desc: 'Well below global average' };
    if (score < 3000) return { label: 'Moderate Impact', class: 'level-mod', desc: 'Around regional average' };
    return { label: 'High Impact', class: 'level-high', desc: 'Substantial opportunity for reduction' };
  };

  return (
    <div className="app-shell">
      {/* GLOBAL NAVBAR */}
      <header className="navbar">
        <div className="nav-container">
          <div className="nav-brand" onClick={() => setActiveTab('overview')} style={{ cursor: 'pointer' }}>
            <div className="brand-icon">
              <Leaf className="leaf-svg" />
            </div>
            <div>
              <span className="brand-name">CarbonWise AI</span>
              <span className="brand-tagline">Personal Sustainability Platform</span>
            </div>
          </div>

          <nav className="nav-links">
            <button
              className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`nav-item ${activeTab === 'assessment' || activeTab === 'results' ? 'active' : ''}`}
              onClick={() => setActiveTab(predictionResult ? 'results' : 'assessment')}
            >
              {predictionResult ? 'Your Footprint' : 'Assessment'}
            </button>
            <button
              className={`nav-item ${activeTab === 'scenario' ? 'active' : ''}`}
              onClick={() => setActiveTab('scenario')}
            >
              What-If Simulator
            </button>
            <button
              className={`nav-item ${activeTab === 'assistant' ? 'active' : ''}`}
              onClick={() => setActiveTab('assistant')}
            >
              AI Guide
            </button>
          </nav>

          <div className="nav-right">
            <button className="btn-cta-small" onClick={() => { setActiveTab('assessment'); setCurrentStep(1); }}>
              Calculate Footprint
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="content-container">

        {/* 1. OVERVIEW / HERO PAGE */}
        {activeTab === 'overview' && (
          <div className="overview-page">
            <section className="hero-section">
              <div className="hero-content">
                <span className="hero-badge">
                  <Globe className="badge-icon" /> Personal Sustainability Platform
                </span>
                <h1 className="hero-title">
                  Understand your footprint.<br />
                  <span className="text-highlight">Make changes that matter.</span>
                </h1>
                <p className="hero-lead">
                  Estimate your personal carbon footprint across daily habits, identify your highest impact areas, and test real lifestyle scenarios to reduce your environmental footprint.
                </p>

                <div className="hero-actions">
                  <button
                    className="btn-primary-lg"
                    onClick={() => { setActiveTab('assessment'); setCurrentStep(1); }}
                  >
                    Start Your Assessment <ChevronRight className="icon-rt" />
                  </button>
                  <button
                    className="btn-secondary-lg"
                    onClick={() => setActiveTab('scenario')}
                  >
                    Explore What-If Simulator
                  </button>
                </div>

                <div className="hero-trust">
                  <span className="trust-item"><ShieldCheck className="trust-ic" /> Private & Anonymous</span>
                  <span className="trust-item"><CheckCircle2 className="trust-ic" /> 19 Lifestyle Indicators</span>
                  <span className="trust-item"><Zap className="trust-ic" /> Interactive What-If Scenarios</span>
                </div>
              </div>

              <div className="hero-preview">
                <div className="preview-card">
                  <div className="preview-header">
                    <span className="p-title">Estimated Annual Footprint</span>
                    <span className="p-badge">Sample Baseline</span>
                  </div>
                  <div className="preview-score">
                    <span className="score-num">2,238</span>
                    <span className="score-unit">kg CO₂e / year</span>
                  </div>
                  <div className="preview-bars">
                    <div className="bar-row">
                      <span>Transportation</span>
                      <div className="bar-bg"><div className="bar-fill" style={{ width: '38%' }}></div></div>
                      <span>38%</span>
                    </div>
                    <div className="bar-row">
                      <span>Air Travel</span>
                      <div className="bar-bg"><div className="bar-fill" style={{ width: '24%' }}></div></div>
                      <span>24%</span>
                    </div>
                    <div className="bar-row">
                      <span>Home Energy</span>
                      <div className="bar-bg"><div className="bar-fill" style={{ width: '18%' }}></div></div>
                      <span>18%</span>
                    </div>
                  </div>
                  <div className="preview-footer">
                    <span className="p-sub font-medium">Top Opportunity: Reducing car travel frequency</span>
                  </div>
                </div>
              </div>
            </section>

            {/* FEATURE HIGHLIGHTS */}
            <section className="features-grid-section">
              <h2 className="section-heading text-center">How CarbonWise Helps You Change</h2>
              <div className="features-grid">
                <div className="feature-card">
                  <div className="f-icon-wrap"><Activity /></div>
                  <h3>Comprehensive Assessment</h3>
                  <p>Covers 19 lifestyle factors across mobility, energy, diet, shopping, and waste management.</p>
                </div>
                <div className="feature-card">
                  <div className="f-icon-wrap"><BarChart3 /></div>
                  <h3>Clear Impact Analysis</h3>
                  <p>Visualizes exactly which choices drive your footprint, helping you prioritize high-impact changes.</p>
                </div>
                <div className="feature-card">
                  <div className="f-icon-wrap"><Sliders /></div>
                  <h3>What-If Simulator</h3>
                  <p>Test alternative lifestyle choices in real time before making real-world commitments.</p>
                </div>
                <div className="feature-card">
                  <div className="f-icon-wrap"><MessageSquare /></div>
                  <h3>AI Sustainability Guide</h3>
                  <p>Get personalized, practical advice tailored to your answers without technical jargon.</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 2. MULTI-STEP ASSESSMENT PAGE */}
        {activeTab === 'assessment' && (
          <div className="assessment-page">
            <div className="assessment-container">

              {/* PROGRESS BAR */}
              <div className="wizard-header">
                <div>
                  <span className="step-indicator">Step {currentStep} of 6</span>
                  <h2 className="wizard-title">
                    {currentStep === 1 && 'About You & Social Life'}
                    {currentStep === 2 && 'Dietary Habits & Food'}
                    {currentStep === 3 && 'Transportation & Mobility'}
                    {currentStep === 4 && 'Home & Energy Consumption'}
                    {currentStep === 5 && 'Shopping & Waste Management'}
                    {currentStep === 6 && 'Review & Calculate'}
                  </h2>
                </div>
                <div className="step-dots">
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <div
                      key={num}
                      className={`step-dot ${num === currentStep ? 'active' : ''} ${num < currentStep ? 'completed' : ''}`}
                      onClick={() => setCurrentStep(num)}
                    >
                      {num < currentStep ? <Check className="check-sm" /> : num}
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmitPrediction} className="wizard-body">

                {/* STEP 1: ABOUT YOU */}
                {currentStep === 1 && (
                  <div className="step-pane">
                    <p className="step-desc">Help us establish baseline indicators for personal consumption analysis.</p>

                    <div className="question-group">
                      <label className="q-label">Body Type Category</label>
                      <div className="option-cards-grid">
                        {[
                          { id: 'underweight', label: 'Underweight' },
                          { id: 'normal', label: 'Normal' },
                          { id: 'overweight', label: 'Overweight' },
                          { id: 'obese', label: 'Obese' }
                        ].map(opt => (
                          <div
                            key={opt.id}
                            className={`option-card ${formData.body_type === opt.id ? 'selected' : ''}`}
                            onClick={() => handleInputChange('body_type', opt.id)}
                          >
                            <span className="opt-title">{opt.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="question-group">
                      <label className="q-label">Sex</label>
                      <div className="option-cards-grid">
                        {[
                          { id: 'female', label: 'Female' },
                          { id: 'male', label: 'Male' }
                        ].map(opt => (
                          <div
                            key={opt.id}
                            className={`option-card ${formData.sex === opt.id ? 'selected' : ''}`}
                            onClick={() => handleInputChange('sex', opt.id)}
                          >
                            <span className="opt-title">{opt.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="question-group">
                      <label className="q-label">Social Activity Level</label>
                      <div className="option-cards-grid">
                        {[
                          { id: 'never', label: 'Rarely / Never', sub: 'Home-focused routine' },
                          { id: 'sometimes', label: 'Sometimes', sub: 'Weekly social outings' },
                          { id: 'often', label: 'Often', sub: 'Frequent social activities' }
                        ].map(opt => (
                          <div
                            key={opt.id}
                            className={`option-card ${formData.social_activity === opt.id ? 'selected' : ''}`}
                            onClick={() => handleInputChange('social_activity', opt.id)}
                          >
                            <span className="opt-title">{opt.label}</span>
                            <span className="opt-sub">{opt.sub}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: DIET & FOOD */}
                {currentStep === 2 && (
                  <div className="step-pane">
                    <p className="step-desc">Food production and agricultural supply chains contribute significantly to carbon output.</p>

                    <div className="question-group">
                      <label className="q-label">Primary Dietary Preference</label>
                      <div className="option-cards-grid">
                        {[
                          { id: 'omnivore', label: 'Omnivore', desc: 'Regular meat and poultry consumption' },
                          { id: 'pescatarian', label: 'Pescatarian', desc: 'Fish and seafood, no meat' },
                          { id: 'vegetarian', label: 'Vegetarian', desc: 'Plant-based diet with dairy/eggs' },
                          { id: 'vegan', label: 'Vegan', desc: '100% plant-based diet' }
                        ].map(opt => (
                          <div
                            key={opt.id}
                            className={`option-card ${formData.diet === opt.id ? 'selected' : ''}`}
                            onClick={() => handleInputChange('diet', opt.id)}
                          >
                            <span className="opt-title">{opt.label}</span>
                            <span className="opt-sub">{opt.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="question-group">
                      <label className="q-label">Monthly Grocery Bill ($ / month)</label>
                      <div className="input-with-unit">
                        <input
                          type="number"
                          min="0"
                          max="2000"
                          value={formData.monthly_grocery_bill}
                          onChange={e => handleInputChange('monthly_grocery_bill', parseFloat(e.target.value) || 0)}
                          className="styled-input"
                        />
                        <span className="unit-tag">$ / month</span>
                      </div>
                    </div>

                    <div className="question-group">
                      <label className="q-label">Cooking Appliances Used Regularly</label>
                      <div className="chip-grid">
                        {['Stove', 'Oven', 'Microwave', 'Grill', 'Airfryer'].map(app => (
                          <button
                            type="button"
                            key={app}
                            className={`chip-btn ${formData.cooking_with.includes(app) ? 'active' : ''}`}
                            onClick={() => handleArrayToggle('cooking_with', app)}
                          >
                            {formData.cooking_with.includes(app) && <Check className="check-chip" />}
                            {app}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: TRANSPORTATION & TRAVEL */}
                {currentStep === 3 && (
                  <div className="step-pane">
                    <p className="step-desc">Mobility habits are typically one of the highest individual carbon contributors.</p>

                    <div className="question-group">
                      <label className="q-label">Primary Mode of Daily Transportation</label>
                      <div className="option-cards-grid">
                        {[
                          { id: 'walk/bicycle', label: 'Walk / Bicycle', desc: 'Active human-powered mobility' },
                          { id: 'public', label: 'Public Transit', desc: 'Bus, metro, or commuter trains' },
                          { id: 'private', label: 'Private Vehicle', desc: 'Personal car or motorcycle' }
                        ].map(opt => (
                          <div
                            key={opt.id}
                            className={`option-card ${formData.transport === opt.id ? 'selected' : ''}`}
                            onClick={() => handleInputChange('transport', opt.id)}
                          >
                            <span className="opt-title">{opt.label}</span>
                            <span className="opt-sub">{opt.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {formData.transport === 'private' && (
                      <div className="question-group">
                        <label className="q-label">Vehicle Fuel / Engine Type</label>
                        <div className="option-cards-grid">
                          {[
                            { id: 'petrol', label: 'Petrol / Gasoline' },
                            { id: 'diesel', label: 'Diesel' },
                            { id: 'hybrid', label: 'Hybrid' },
                            { id: 'electric', label: 'Electric Vehicle (EV)' },
                            { id: 'lpg', label: 'LPG / Gas' }
                          ].map(opt => (
                            <div
                              key={opt.id}
                              className={`option-card ${formData.vehicle_type === opt.id ? 'selected' : ''}`}
                              onClick={() => handleInputChange('vehicle_type', opt.id)}
                            >
                              <span className="opt-title">{opt.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="question-group">
                      <label className="q-label">Monthly Distance Traveled (km / month)</label>
                      <div className="input-with-unit">
                        <input
                          type="number"
                          min="0"
                          max="10000"
                          value={formData.vehicle_monthly_distance_km}
                          onChange={e => handleInputChange('vehicle_monthly_distance_km', parseFloat(e.target.value) || 0)}
                          className="styled-input"
                        />
                        <span className="unit-tag">km / month</span>
                      </div>
                    </div>

                    <div className="question-group">
                      <label className="q-label">Air Travel Frequency</label>
                      <div className="option-cards-grid">
                        {[
                          { id: 'never', label: 'Never', desc: 'No air travel' },
                          { id: 'rarely', label: 'Rarely', desc: '1-2 short flights annually' },
                          { id: 'frequently', label: 'Frequently', desc: '3-6 flights annually' },
                          { id: 'very frequently', label: 'Very Frequently', desc: '7+ flights annually' }
                        ].map(opt => (
                          <div
                            key={opt.id}
                            className={`option-card ${formData.frequency_of_traveling_by_air === opt.id ? 'selected' : ''}`}
                            onClick={() => handleInputChange('frequency_of_traveling_by_air', opt.id)}
                          >
                            <span className="opt-title">{opt.label}</span>
                            <span className="opt-sub">{opt.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: HOME & ENERGY */}
                {currentStep === 4 && (
                  <div className="step-pane">
                    <p className="step-desc">Household power, heating fuel, and daily digital habits impact indirect energy emissions.</p>

                    <div className="question-group">
                      <label className="q-label">Heating Energy Source</label>
                      <div className="option-cards-grid">
                        {[
                          { id: 'electricity', label: 'Electricity', desc: 'Heat pump or electric furnace' },
                          { id: 'natural gas', label: 'Natural Gas', desc: 'Piped gas boiler' },
                          { id: 'wood', label: 'Wood / Biomass', desc: 'Stove or fireplace' },
                          { id: 'coal', label: 'Coal', desc: 'Coal heating system' }
                        ].map(opt => (
                          <div
                            key={opt.id}
                            className={`option-card ${formData.heating_energy_source === opt.id ? 'selected' : ''}`}
                            onClick={() => handleInputChange('heating_energy_source', opt.id)}
                          >
                            <span className="opt-title">{opt.label}</span>
                            <span className="opt-sub">{opt.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="question-group">
                      <label className="q-label">Energy Conservation Habits</label>
                      <div className="option-cards-grid">
                        {[
                          { id: 'Yes', label: 'Active Saver', desc: 'Always unplug idle gear, LED bulbs, efficient thermostat' },
                          { id: 'Sometimes', label: 'Moderate', desc: 'Occasional energy saving practices' },
                          { id: 'No', label: 'Minimal Focus', desc: 'Standard power consumption' }
                        ].map(opt => (
                          <div
                            key={opt.id}
                            className={`option-card ${formData.energy_efficiency === opt.id ? 'selected' : ''}`}
                            onClick={() => handleInputChange('energy_efficiency', opt.id)}
                          >
                            <span className="opt-title">{opt.label}</span>
                            <span className="opt-sub">{opt.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid-2-col">
                      <div className="question-group">
                        <label className="q-label">Daily TV / PC Screen Time (hours / day)</label>
                        <div className="input-with-unit">
                          <input
                            type="number"
                            min="0"
                            max="24"
                            value={formData.how_long_tv_pc_daily_hour}
                            onChange={e => handleInputChange('how_long_tv_pc_daily_hour', parseFloat(e.target.value) || 0)}
                            className="styled-input"
                          />
                          <span className="unit-tag">hrs / day</span>
                        </div>
                      </div>

                      <div className="question-group">
                        <label className="q-label">Daily Internet Usage (hours / day)</label>
                        <div className="input-with-unit">
                          <input
                            type="number"
                            min="0"
                            max="24"
                            value={formData.how_long_internet_daily_hour}
                            onChange={e => handleInputChange('how_long_internet_daily_hour', parseFloat(e.target.value) || 0)}
                            className="styled-input"
                          />
                          <span className="unit-tag">hrs / day</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5: SHOPPING & WASTE */}
                {currentStep === 5 && (
                  <div className="step-pane">
                    <p className="step-desc">Consumer purchases and waste disposal habits reflect embodied lifecycle carbon.</p>

                    <div className="question-group">
                      <label className="q-label">New Clothing Purchases (items / month)</label>
                      <div className="input-with-unit">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.how_many_new_clothes_monthly}
                          onChange={e => handleInputChange('how_many_new_clothes_monthly', parseInt(e.target.value) || 0)}
                          className="styled-input"
                        />
                        <span className="unit-tag">items / month</span>
                      </div>
                    </div>

                    <div className="question-group">
                      <label className="q-label">Waste Bag Size & Weekly Disposal</label>
                      <div className="grid-2-col">
                        <select
                          value={formData.waste_bag_size}
                          onChange={e => handleInputChange('waste_bag_size', e.target.value)}
                          className="styled-select"
                        >
                          <option value="small">Small Bag</option>
                          <option value="medium">Medium Bag</option>
                          <option value="large">Large Bag</option>
                          <option value="extra large">Extra Large Bag</option>
                        </select>

                        <div className="input-with-unit">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={formData.waste_bag_weekly_count}
                            onChange={e => handleInputChange('waste_bag_weekly_count', parseInt(e.target.value) || 0)}
                            className="styled-input"
                          />
                          <span className="unit-tag">bags / week</span>
                        </div>
                      </div>
                    </div>

                    <div className="question-group">
                      <label className="q-label">Recycling Categories Practiced</label>
                      <div className="chip-grid">
                        {['Paper', 'Plastic', 'Glass', 'Metal'].map(item => (
                          <button
                            type="button"
                            key={item}
                            className={`chip-btn ${formData.recycling.includes(item) ? 'active' : ''}`}
                            onClick={() => handleArrayToggle('recycling', item)}
                          >
                            {formData.recycling.includes(item) && <Check className="check-chip" />}
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 6: REVIEW & SUBMIT */}
                {currentStep === 6 && (
                  <div className="step-pane">
                    <h3>Review Your Answers</h3>
                    <p className="step-desc">Confirm your inputs before generating your personal carbon footprint assessment.</p>

                    <div className="review-summary-grid">
                      <div className="review-box">
                        <span className="r-label">Transportation</span>
                        <span className="r-val">{formData.transport} ({formData.vehicle_monthly_distance_km} km/mo)</span>
                      </div>
                      <div className="review-box">
                        <span className="r-label">Air Travel</span>
                        <span className="r-val">{formData.frequency_of_traveling_by_air}</span>
                      </div>
                      <div className="review-box">
                        <span className="r-label">Dietary Habit</span>
                        <span className="r-val">{formData.diet}</span>
                      </div>
                      <div className="review-box">
                        <span className="r-label">Heating Source</span>
                        <span className="r-val">{formData.heating_energy_source}</span>
                      </div>
                      <div className="review-box">
                        <span className="r-label">Waste Bags</span>
                        <span className="r-val">{formData.waste_bag_weekly_count} {formData.waste_bag_size} bags/week</span>
                      </div>
                      <div className="review-box">
                        <span className="r-label">New Apparel</span>
                        <span className="r-val">{formData.how_many_new_clothes_monthly} items/month</span>
                      </div>
                    </div>

                    {errorMsg && (
                      <div className="alert alert-danger margin-top">
                        <AlertTriangle className="icon-sm" />
                        <span>{errorMsg}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* WIZARD BUTTONS */}
                <div className="wizard-actions">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      className="btn-outline-md"
                      onClick={() => setCurrentStep(prev => prev - 1)}
                    >
                      <ChevronLeft className="icon-lt" /> Back
                    </button>
                  )}
                  
                  {currentStep < 6 ? (
                    <button
                      type="button"
                      className="btn-primary-md"
                      onClick={() => setCurrentStep(prev => prev + 1)}
                    >
                      Next Step <ChevronRight className="icon-rt" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="btn-submit-lg"
                      disabled={loadingPrediction}
                    >
                      {loadingPrediction ? (
                        <>
                          <RefreshCw className="spin icon-sm" /> Calculating Your Footprint...
                        </>
                      ) : (
                        <>
                          <Sparkles className="icon-sm" /> Calculate Footprint Analysis
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 3. RESULTS & ACTION PLAN PAGE */}
        {activeTab === 'results' && predictionResult && (
          <div className="results-page">
            <div className="results-wrapper">

              {/* MAIN FOOTPRINT SCORE BANNER */}
              <div className="footprint-score-card">
                <div className="score-main">
                  <span className="eyebrow">Your Estimated Annual Footprint</span>
                  <div className="score-big">
                    <span className="number">{predictionResult.predicted_carbon_emission.toLocaleString()}</span>
                    <span className="unit">kg CO₂e / year</span>
                  </div>
                  {(() => {
                    const lvl = getFootprintLevel(predictionResult.predicted_carbon_emission);
                    return (
                      <div className={`level-pill ${lvl.class}`}>
                        <span className="pill-dot"></span>
                        <span className="pill-text">{lvl.label} — {lvl.desc}</span>
                      </div>
                    );
                  })()}
                </div>

                <div className="score-actions">
                  <button
                    className="btn-action-primary"
                    onClick={() => setActiveTab('scenario')}
                  >
                    <Sliders className="ic-btn" /> Explore What-If Simulator
                  </button>
                  <button
                    className="btn-action-secondary"
                    onClick={() => { setActiveTab('assessment'); setCurrentStep(1); }}
                  >
                    Edit Assessment Answers
                  </button>
                </div>
              </div>

              {/* IMPACT BREAKDOWN CHART */}
              <div className="results-card">
                <h3 className="card-heading">Here's What Shapes Your Footprint</h3>
                <p className="card-subheading">Major drivers contributing to your annual estimated footprint:</p>

                <div className="impact-bars-container">
                  {predictionResult.top_factors.map((factor, idx) => (
                    <div key={idx} className="impact-bar-item">
                      <div className="bar-label-group">
                        <span className="feat-title">{factor.feature}</span>
                        <span className="feat-pct">{factor.importance}%</span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill-emerald"
                          style={{ width: `${Math.min(100, factor.importance * 2.2)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI GROUNDED GUIDANCE */}
              <div className="results-card ai-explanation-card">
                <div className="ai-title-row">
                  <Sparkles className="ai-sparkle-icon" />
                  <h3>AI Sustainability Summary</h3>
                </div>
                <div className="ai-text-content">
                  {predictionResult.ai_explanation.split('\n\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </div>

              {/* PERSONAL ACTION PLAN */}
              <div className="results-card">
                <h3 className="card-heading">Your Personal Action Plan</h3>
                <p className="card-subheading">Targeted adjustments in your highest impact areas yield the largest emission reductions.</p>

                <div className="action-plan-grid">
                  {predictionResult.recommendations.map((rec, i) => (
                    <div key={i} className="action-plan-card">
                      <div className="action-top">
                        <span className={`priority-chip ${rec.priority.toLowerCase()}`}>
                          {rec.priority} Priority
                        </span>
                        <span className="cat-chip">{rec.category}</span>
                      </div>

                      <h4 className="action-title">{rec.title}</h4>
                      <p className="action-desc">{rec.description}</p>
                      
                      <div className="action-footer">
                        <span className="potential-impact">{rec.impact}</span>
                        <button
                          className="btn-try-scenario"
                          onClick={() => {
                            setActiveTab('scenario');
                          }}
                        >
                          Try This Scenario <ChevronRight className="ic-sm" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 4. WHAT-IF SIMULATOR PAGE */}
        {activeTab === 'scenario' && (
          <div className="scenario-page">
            <div className="scenario-wrapper">
              <div className="scenario-intro">
                <h2>Explore a Different Lifestyle</h2>
                <p>Modify your choices to observe how adjustments reduce your estimated annual footprint.</p>
              </div>

              {/* QUICK PRESETS */}
              <div className="presets-bar">
                <span className="presets-label">Quick Scenario Presets:</span>
                <button className="preset-btn" onClick={() => applyScenarioPreset('eco_commuter')}>
                  <Car className="p-ic" /> Public Transit Commuter
                </button>
                <button className="preset-btn" onClick={() => applyScenarioPreset('clean_energy')}>
                  <Zap className="p-ic" /> Clean Heating & Plant-Forward
                </button>
                <button className="preset-btn" onClick={() => applyScenarioPreset('zero_waste')}>
                  <ShoppingBag className="p-ic" /> Low Consumer Waste
                </button>
                <button
                  className="preset-btn reset"
                  onClick={() => setScenarioData({ ...formData })}
                >
                  <RotateCcw className="p-ic" /> Reset to Baseline
                </button>
              </div>

              <div className="scenario-workspace">
                {/* CONTROL PANEL */}
                <div className="card controls-card">
                  <h3>Modify Lifestyle Choices</h3>
                  
                  <div className="controls-form">
                    <div className="control-group">
                      <label>Transportation Mode</label>
                      <select
                        value={scenarioData.transport}
                        onChange={e => handleScenarioChange('transport', e.target.value)}
                        className="styled-select"
                      >
                        <option value="walk/bicycle">Walk / Bicycle</option>
                        <option value="public">Public Transit</option>
                        <option value="private">Private Vehicle</option>
                      </select>
                    </div>

                    {scenarioData.transport === 'private' && (
                      <div className="control-group">
                        <label>Vehicle Fuel Type</label>
                        <select
                          value={scenarioData.vehicle_type}
                          onChange={e => handleScenarioChange('vehicle_type', e.target.value)}
                          className="styled-select"
                        >
                          <option value="electric">Electric Vehicle (EV)</option>
                          <option value="hybrid">Hybrid</option>
                          <option value="petrol">Petrol</option>
                          <option value="diesel">Diesel</option>
                        </select>
                      </div>
                    )}

                    <div className="control-group">
                      <label>Vehicle Distance: <strong>{scenarioData.vehicle_monthly_distance_km} km / month</strong></label>
                      <input
                        type="range"
                        min="0"
                        max="5000"
                        step="50"
                        value={scenarioData.vehicle_monthly_distance_km}
                        onChange={e => handleScenarioChange('vehicle_monthly_distance_km', parseFloat(e.target.value) || 0)}
                        className="styled-slider"
                      />
                    </div>

                    <div className="control-group">
                      <label>Air Travel Frequency</label>
                      <select
                        value={scenarioData.frequency_of_traveling_by_air}
                        onChange={e => handleScenarioChange('frequency_of_traveling_by_air', e.target.value)}
                        className="styled-select"
                      >
                        <option value="never">Never</option>
                        <option value="rarely">Rarely</option>
                        <option value="frequently">Frequently</option>
                        <option value="very frequently">Very Frequently</option>
                      </select>
                    </div>

                    <div className="control-group">
                      <label>Dietary Habit</label>
                      <select
                        value={scenarioData.diet}
                        onChange={e => handleScenarioChange('diet', e.target.value)}
                        className="styled-select"
                      >
                        <option value="vegan">Vegan</option>
                        <option value="vegetarian">Vegetarian</option>
                        <option value="pescatarian">Pescatarian</option>
                        <option value="omnivore">Omnivore</option>
                      </select>
                    </div>

                    <div className="control-group">
                      <label>Heating Energy Source</label>
                      <select
                        value={scenarioData.heating_energy_source}
                        onChange={e => handleScenarioChange('heating_energy_source', e.target.value)}
                        className="styled-select"
                      >
                        <option value="electricity">Electricity</option>
                        <option value="natural gas">Natural Gas</option>
                        <option value="wood">Wood</option>
                        <option value="coal">Coal</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleRunScenario}
                    className="btn-primary-lg block-btn margin-top"
                    disabled={loadingScenario}
                  >
                    {loadingScenario ? (
                      <>
                        <RefreshCw className="spin icon-sm" /> Calculating Scenario Impact...
                      </>
                    ) : (
                      <>
                        <TrendingDown className="icon-sm" /> Calculate Scenario Reduction
                      </>
                    )}
                  </button>
                </div>

                {/* SIMULATION DISPLAY */}
                <div className="simulation-results-column">
                  {scenarioResult ? (
                    <div className="card simulation-card">
                      <h3>Scenario Simulation Output</h3>

                      <div className="comparison-cards">
                        <div className="comp-card baseline">
                          <span className="c-label">Baseline Footprint</span>
                          <div className="c-score">{scenarioResult.current_prediction.toLocaleString()}</div>
                          <span className="c-unit">kg CO₂e / yr</span>
                        </div>

                        <div className="comp-divider">
                          <ArrowRight className="arrow-ic" />
                        </div>

                        <div className="comp-card scenario">
                          <span className="c-label">Simulated Scenario</span>
                          <div className="c-score">{scenarioResult.scenario_prediction.toLocaleString()}</div>
                          <span className="c-unit">kg CO₂e / yr</span>
                        </div>
                      </div>

                      <div className={`delta-box ${scenarioResult.difference >= 0 ? 'saving' : 'increase'}`}>
                        <div className="delta-header">
                          <TrendingDown className="delta-ic" />
                          <div>
                            <h4>
                              {scenarioResult.difference >= 0
                                ? `Potential Savings: ${scenarioResult.difference.toLocaleString()} kg CO₂e (${scenarioResult.percentage_change}%)`
                                : `Emission Increase: ${Math.abs(scenarioResult.difference).toLocaleString()} kg CO₂e`}
                            </h4>
                            <p className="delta-desc">{scenarioResult.explanation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="card placeholder-simulation-card">
                      <Sliders className="ph-ic" />
                      <h3>Select a Scenario or Modify Parameters</h3>
                      <p>Adjust transportation, energy, or diet settings on the left and click <strong>Calculate Scenario Reduction</strong> to view your potential impact.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. AI GUIDE / ASSISTANT PAGE */}
        {activeTab === 'assistant' && (
          <div className="assistant-page">
            <div className="assistant-card card">
              <div className="assistant-header">
                <div className="a-icon"><Sparkles /></div>
                <div>
                  <h2>CarbonWise Guide</h2>
                  <p>Ask questions about your footprint, lifestyle choices, and practical ways to reduce your impact.</p>
                </div>
              </div>

              <div className="chat-window">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`chat-bubble-row ${msg.sender}`}>
                    <div className="bubble">
                      {msg.text.split('\n').map((line, lIdx) => (
                        <p key={lIdx}>{line}</p>
                      ))}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="chat-bubble-row assistant loading">
                    <div className="bubble">
                      <RefreshCw className="spin ic-sm" /> CarbonWise is thinking...
                    </div>
                  </div>
                )}
              </div>

              <div className="suggested-prompts-bar">
                <span className="p-title font-medium">Suggested Questions:</span>
                <button onClick={() => handleSendMessage('Why is my footprint high?')}>
                  Why is my footprint high?
                </button>
                <button onClick={() => handleSendMessage('What factor should I change first?')}>
                  What should I change first?
                </button>
                <button onClick={() => handleSendMessage('How can I reduce transportation emissions?')}>
                  Reduce transportation emissions
                </button>
                <button onClick={() => handleSendMessage('Would changing my diet make a difference?')}>
                  Impact of changing diet
                </button>
              </div>

              <div className="input-send-bar">
                <input
                  type="text"
                  placeholder="Ask a question about your personal carbon footprint..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  className="chat-input"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={chatLoading || !chatInput.trim()}
                  className="btn-send"
                >
                  <Send className="ic-send" />
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* GLOBAL FOOTER */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="brand-icon sm"><Leaf className="leaf-svg" /></div>
            <div>
              <span className="footer-title">CarbonWise AI</span>
              <p className="footer-sub">Make informed choices. Reduce your impact.</p>
            </div>
          </div>

          <div className="footer-links">
            <button onClick={() => setActiveTab('overview')}>About</button>
            <button onClick={() => setActiveTab('assessment')}>Assessment</button>
            <button onClick={() => setActiveTab('scenario')}>Simulator</button>
          </div>

          <div className="footer-right">
            <span className="sdg-tag">Aligned with SDG 13 — Climate Action</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
