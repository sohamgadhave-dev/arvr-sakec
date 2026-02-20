/**
 * AIAssistant — context-aware floating panel with rule-based insights per experiment.
 */
export class AIAssistant {
    constructor(studentData, adaptiveLearning) {
        this.studentData = studentData;
        this.adaptive = adaptiveLearning;
        this.currentExperiment = null;
        this.visible = false;
        this.lastHint = '';
        this.remarks = [];
        this._createUI();
    }

    _createUI() {
        // Toggle button
        this.toggleBtn = document.createElement('button');
        this.toggleBtn.className = 'ai-toggle';
        this.toggleBtn.innerHTML = '🤖';
        this.toggleBtn.title = 'AI Lab Assistant';
        this.toggleBtn.addEventListener('click', () => this.toggle());
        document.body.appendChild(this.toggleBtn);

        // Panel
        this.panel = document.createElement('div');
        this.panel.className = 'ai-panel glass';
        this.panel.innerHTML = `
      <div class="ai-header">
        <span class="ai-title">🤖 AI Lab Assistant</span>
        <button class="ai-close" id="ai-close">✕</button>
      </div>
      <div class="ai-body" id="ai-body">
        <div class="ai-welcome">
          <p>Hello! I'm your AI lab assistant. Ask me anything about the experiment or physics concepts!</p>
        </div>
      </div>
      <div class="ai-tier" id="ai-tier"></div>
      <div class="ai-input-area">
        <input type="text" class="ai-input" id="ai-input" placeholder="Ask me anything..." autocomplete="off" />
        <button class="ai-send" id="ai-send">➤</button>
      </div>
    `;
        document.body.appendChild(this.panel);

        document.getElementById('ai-close')?.addEventListener('click', () => this.hide());

        // Chat input handling
        const input = document.getElementById('ai-input');
        const sendBtn = document.getElementById('ai-send');
        if (input && sendBtn) {
            const send = () => {
                const text = input.value.trim();
                if (text) {
                    this._handleUserMessage(text);
                    input.value = '';
                }
            };
            sendBtn.addEventListener('click', send);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); send(); }
            });
        }

        // Build knowledge base
        this._buildKnowledgeBase();
    }

    show() {
        this.visible = true;
        this.panel.classList.add('show');
        this.toggleBtn.classList.add('active');
    }

    hide() {
        this.visible = false;
        this.panel.classList.remove('show');
        this.toggleBtn.classList.remove('active');
    }

    toggle() { this.visible ? this.hide() : this.show(); }

    setExperiment(experimentId) {
        this.currentExperiment = experimentId;
        this.remarks = [];
        this._updateTier();
        this._addMessage(`Now observing: ${this._expName(experimentId)}. I'll provide real-time insights as you adjust parameters.`, 'system');
    }

    _expName(id) {
        const names = { projectile: 'Projectile Motion', 'ohms-law': "Ohm's Law Circuit", pendulum: 'Simple Pendulum' };
        return names[id] || id;
    }

    _updateTier() {
        const tierInfo = this.adaptive.getTierInfo();
        const el = document.getElementById('ai-tier');
        if (el) {
            el.innerHTML = `<span style="color:${tierInfo.color}">${tierInfo.icon} ${tierInfo.label}</span>`;
        }
    }

    /**
     * Observe parameter changes and give contextual feedback.
     */
    onParameterChange(paramId, value, allParams) {
        if (!this.currentExperiment) return;
        const hint = this._getContextHint(this.currentExperiment, paramId, value, allParams);
        if (hint && hint !== this.lastHint) {
            this.lastHint = hint;
            this._addMessage(hint, 'insight');
            this._pulseToggle();
        }
    }

    /**
     * Observe experiment results and comment.
     */
    onResult(results) {
        if (!this.currentExperiment) return;
        const comment = this._getResultComment(this.currentExperiment, results);
        if (comment) {
            this._addMessage(comment, 'observation');
            this.remarks.push(comment);
        }
    }

    /**
     * After quiz, explain mistakes and give encouragement.
     */
    onQuizComplete(score, total, wrongQuestions) {
        const pct = (score / total) * 100;
        if (pct === 100) {
            this._addMessage("🏆 Perfect score! You've demonstrated excellent understanding of the concepts.", 'success');
        } else if (pct >= 60) {
            this._addMessage(`Good job scoring ${score}/${total}! Review the concepts you missed to strengthen your understanding.`, 'insight');
        } else {
            this._addMessage(`You scored ${score}/${total}. Don't worry — learning takes practice! Try re-reading the formulas and experiment again.`, 'encourage');
        }

        if (wrongQuestions && wrongQuestions.length > 0) {
            const explanations = wrongQuestions.map(q => `• ${q.question}: ${q.explanation}`).join('\n');
            this._addMessage(`Here's what to review:\n${explanations}`, 'explain');
        }

        this.remarks.push(`Quiz score: ${score}/${total} (${pct.toFixed(0)}%)`);
        this._updateTier();
    }

    /**
     * Suggest practice if student is struggling.
     */
    checkStruggle() {
        if (this.adaptive.shouldSuggestPractice()) {
            this._addMessage("💡 I notice you're finding some concepts challenging. Try experimenting with different parameter values before retaking the quiz — hands-on exploration builds intuition!", 'encourage');
        }

        const weak = this.adaptive.getWeakConcepts();
        if (weak.length > 0) {
            const concepts = weak.slice(0, 3).map(w => `• ${w.concept.split(':')[1] || w.concept}: ${w.accuracy}%`).join('\n');
            this._addMessage(`Focus areas:\n${concepts}`, 'insight');
        }
    }

    getRemarks() {
        return this.remarks.join(' | ');
    }

    // ─── Chat Q&A Engine ────────────────────────────────

    _handleUserMessage(text) {
        this._addMessage(text, 'user');
        setTimeout(() => {
            const response = this._getResponse(text);
            this._addMessage(response, 'insight');
        }, 300 + Math.random() * 400);
    }

    // Synonym map for fuzzy matching
    _synonyms() {
        return {
            'velocity': ['speed', 'fast', 'slow', 'initial velocity', 'v0', 'velocity'],
            'angle': ['degree', 'degrees', 'theta', 'launch angle', 'angle', 'tilt', 'direction', 'inclination'],
            'range': ['distance', 'how far', 'horizontal', 'land', 'range', 'reach', 'far'],
            'height': ['high', 'peak', 'maximum height', 'altitude', 'tall', 'top', 'height', 'highest'],
            'time': ['duration', 'how long', 'airborne', 'flight time', 'time of flight', 'seconds', 'time'],
            'mass': ['weight', 'heavy', 'light', 'kg', 'kilogram', 'mass'],
            'gravity': ['g', 'gravitational', 'acceleration due to', 'gravity', 'planet', 'moon', 'mars', 'earth', 'jupiter'],
            'trajectory': ['path', 'curve', 'parabola', 'shape', 'arc', 'trajectory', 'motion path'],
            'formula': ['equation', 'formula', 'calculate', 'calculation', 'math', 'derive', 'derivation', 'expression', 'solve'],
            'resistance': ['resistor', 'ohm', 'ohms', 'resist', 'resistance', 'impede', 'oppose'],
            'current': ['ampere', 'amp', 'amps', 'flow', 'electron', 'current', 'i'],
            'voltage': ['volt', 'volts', 'potential', 'emf', 'voltage', 'battery', 'source', 'supply'],
            'power': ['watt', 'watts', 'dissipation', 'heat', 'energy rate', 'power', 'consume', 'consumption'],
            'circuit': ['series', 'parallel', 'wire', 'circuit', 'loop', 'connection', 'network'],
            'period': ['time period', 'oscillation time', 'swing time', 'cycle', 'period', 'T'],
            'length': ['string', 'rope', 'wire length', 'long', 'short', 'meter', 'length', 'pendulum length'],
            'frequency': ['hertz', 'hz', 'oscillation', 'frequency', 'cycles', 'vibration'],
            'damping': ['friction', 'decay', 'stop', 'slow down', 'die', 'damping', 'air resistance', 'drag', 'loss'],
            'energy': ['kinetic', 'potential', 'conservation', 'pe', 'ke', 'joule', 'energy'],
            'projectile': ['projectile', 'launch', 'throw', 'ball', 'fire', 'shoot', 'cannon', 'catapult'],
            'pendulum': ['pendulum', 'swing', 'bob', 'oscillate', 'clock', 'metronome'],
            'explain': ['explain', 'what is', 'what are', 'what does', 'how does', 'how do', 'why does', 'tell me about', 'describe', 'define', 'meaning'],
        };
    }

    _stopWords() {
        return new Set(['the', 'is', 'it', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'but',
            'this', 'that', 'if', 'do', 'does', 'did', 'can', 'will', 'would', 'should', 'could',
            'me', 'my', 'you', 'your', 'we', 'our', 'its', 'am', 'are', 'was', 'were', 'be', 'been',
            'with', 'from', 'about', 'into', 'not', 'no', 'so', 'how', 'what', 'when', 'where', 'which',
            'there', 'here', 'than', 'then', 'also', 'just', 'very', 'much', 'more', 'some', 'have', 'has']);
    }

    _tokenize(text) {
        const stops = this._stopWords();
        return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !stops.has(w));
    }

    _expandQuery(query) {
        const words = this._tokenize(query);
        const expanded = new Set(words);
        const q = query.toLowerCase();
        const syns = this._synonyms();
        for (const [canonical, alts] of Object.entries(syns)) {
            for (const alt of alts) {
                // Multi-word phrase match in the query
                if (alt.includes(' ') && q.includes(alt)) {
                    expanded.add(canonical);
                    break;
                }
                // Exact word match only (not substring) — word must be at least 3 chars
                if (!alt.includes(' ') && alt.length >= 3 && words.includes(alt)) {
                    expanded.add(canonical);
                    break;
                }
            }
        }
        return expanded;
    }

    _getResponse(query) {
        const q = query.toLowerCase().trim();

        // === CONVERSATIONAL PATTERNS — check FIRST ===
        if (/^(hi|hello|hey|howdy|hola|namaste|yo|sup)\s*[!?.]*$/i.test(q)) {
            return "Hello! 👋 I'm your AI lab assistant. Ask me about physics, the experiment, formulas, or anything science-related!";
        }
        if (/^(thank|thanks|thx|ty|thank you)/i.test(q)) {
            return "You're welcome! Keep experimenting — that's how real scientists learn. 😊🔬";
        }
        if (/^(bye|goodbye|see you|exit|quit)/i.test(q)) {
            return "Goodbye! Come back anytime you want to explore physics. Happy experimenting! 👋🔬";
        }
        if (/^(good|great|nice|awesome|cool|wow|amazing|ok|okay)/i.test(q) && q.length < 20) {
            return "Glad you think so! 🎉 Physics is amazing when you see it in action. Keep experimenting!";
        }
        if (/help|what can you|how to use|how do i use/i.test(q)) {
            return "I can help with:\n• Explaining physics formulas and concepts\n• Projectile motion, Ohm's law, pendulum topics\n• Tips on experiment parameters\n• Answering 'what if' questions\n• General physics (Newton's laws, energy, forces)\nJust type your question! 🔬";
        }
        if (/who are you|what are you|your name|about you/i.test(q)) {
            return "I'm your AI Lab Assistant 🤖 — built right into this virtual engineering lab! I know physics concepts, formulas, and can help you understand experiments. I'm always learning with you!";
        }

        // === KNOWLEDGE BASE LOOKUP ===
        const expandedWords = this._expandQuery(query);

        let bestMatch = null;
        let bestScore = 0;

        for (const entry of this._knowledgeBase) {
            let score = 0;
            let directHits = 0;
            for (const kw of entry.keywords) {
                // Direct substring match — highest priority
                if (q.includes(kw)) {
                    score += kw.split(/\s+/).length * 3;
                    directHits++;
                }
                // Expanded word match (only words ≥ 3 chars in keyword)
                const kwWords = kw.split(/\s+/).filter(w => w.length >= 3);
                for (const w of kwWords) {
                    if (expandedWords.has(w)) score += 1;
                }
            }
            // Only boost if there's a real direct hit
            if (entry.experiment && entry.experiment === this.currentExperiment && directHits > 0) score *= 1.3;
            if (!entry.experiment && directHits > 0) score += 1;
            if (score > bestScore) { bestScore = score; bestMatch = entry; }
        }

        if (bestMatch && bestScore >= 3) {
            return bestMatch.answer;
        }

        // --- Smart contextual fallback based on current experiment ---
        if (this.currentExperiment === 'projectile') {
            return "🤔 Interesting question! In projectile motion, the key concepts are:\n• Range: R = v²sin(2θ)/g\n• Max Height: H = v²sin²(θ)/2g\n• Flight Time: T = 2v·sin(θ)/g\n• 45° gives maximum range\n• Mass doesn't affect trajectory\nTry asking about any of these specifically!";
        }
        if (this.currentExperiment === 'ohms-law') {
            return "🤔 Interesting question! In Ohm's Law circuits:\n• V = I × R (Voltage = Current × Resistance)\n• P = I²R (Power dissipation)\n• Series: resistances add\n• Parallel: 1/R_total = Σ(1/Ri)\nAsk me about any of these topics!";
        }
        if (this.currentExperiment === 'pendulum') {
            return "🤔 Interesting question! For pendulums:\n• Period: T = 2π√(L/g)\n• Period depends on length & gravity only\n• Mass doesn't matter!\n• Small angle approximation\n• Energy converts between KE ↔ PE\nAsk me about any of these!";
        }

        return "Great question! I can discuss physics topics like:\n• Projectile motion (range, angles, trajectory)\n• Ohm's Law (voltage, current, resistance)\n• Pendulums (period, length, energy)\n• Newton's Laws, forces, energy\nJust ask! 🔬";
    }

    _buildKnowledgeBase() {
        this._knowledgeBase = [
            // ═══════════════════════════════════════════════
            // PROJECTILE MOTION — comprehensive coverage
            // ═══════════════════════════════════════════════
            {
                keywords: ['range', 'formula', 'distance', 'how far', 'calculate range'], experiment: 'projectile',
                answer: "📐 Range Formula: R = (v² × sin(2θ)) / g\n\nWhere:\n• v = initial velocity (m/s)\n• θ = launch angle (degrees)\n• g = acceleration due to gravity (9.81 m/s²)\n\nMaximum range occurs at 45°."
            },
            {
                keywords: ['angle', 'angle matter', 'why angle', 'does angle', 'launch angle', 'change angle', 'degree'], experiment: 'projectile',
                answer: "📐 Angle is crucial in projectile motion!\n\nThe launch angle determines the split between horizontal and vertical velocity:\n• Low angles (10-30°): more horizontal speed, less height, shorter air time\n• 45°: perfect balance → maximum range\n• High angles (60-90°): more height, less range\n\nThe range formula R = v²sin(2θ)/g shows that range depends directly on angle via sin(2θ). Complementary angles (like 30° & 60°) give the same range!"
            },
            {
                keywords: ['maximum range', 'best angle', 'optimal angle', 'farthest', '45', 'max range'], experiment: 'projectile',
                answer: "🎯 The optimal launch angle for maximum range is 45°.\n\nWhy? Because sin(2×45°) = sin(90°) = 1, which maximizes the range formula R = v²sin(2θ)/g.\n\nAt 45°, horizontal and vertical velocity components are equal, giving the perfect balance between going far and staying airborne."
            },
            {
                keywords: ['complementary', 'symmetry', 'same range', '30 60', '20 70', 'mirror'], experiment: 'projectile',
                answer: "🪞 Complementary Angle Symmetry:\n\nAngles that add up to 90° give the same range!\n• 30° and 60° → same range\n• 20° and 70° → same range\n• 15° and 75° → same range\n\nThe trajectories look different (one high arc, one flat), but they land at the same distance. This is because sin(2θ) = sin(180°-2θ)."
            },
            {
                keywords: ['trajectory', 'path', 'parabola', 'shape', 'curve', 'arc'], experiment: 'projectile',
                answer: "🏹 The trajectory is a parabola. This happens because:\n• Horizontal velocity stays constant (no force)\n• Vertical velocity changes due to gravity (constant acceleration downward)\n\nEquation: y = x·tan(θ) - (g·x²)/(2·v²·cos²θ)\n\nThe path is symmetric — the ascending and descending halves are mirror images."
            },
            {
                keywords: ['velocity', 'speed', 'initial velocity', 'fast', 'v0', 'how fast'], experiment: 'projectile',
                answer: "🚀 Initial Velocity Effects:\n\n• Range ∝ v² → doubling speed = 4× the range!\n• Height ∝ v² → doubling speed = 4× the height\n• Time ∝ v → doubling speed = 2× flight time\n\nVelocity components:\n• Horizontal: vₓ = v·cos(θ) — stays constant\n• Vertical: vᵧ = v·sin(θ) — decreases due to gravity"
            },
            {
                keywords: ['gravity', 'planet', 'moon', 'mars', 'jupiter', 'earth', 'g value'], experiment: 'projectile',
                answer: "🌍 Gravity on Different Bodies:\n\n• Earth: g = 9.81 m/s² (standard)\n• Moon: g = 1.62 m/s² (6× farther range!)\n• Mars: g = 3.72 m/s² (2.6× farther)\n• Jupiter: g = 24.79 m/s² (shorter range)\n\nLower gravity → longer flight time → greater range and height."
            },
            {
                keywords: ['height', 'maximum height', 'peak', 'highest', 'how high', 'top'], experiment: 'projectile',
                answer: "📏 Maximum Height: H = (v² × sin²θ) / (2g)\n\n• At 90°: maximum height, zero range\n• At 45°: H = v²/(4g) — half of max possible height\n• At 0°: zero height (ground level throw)\n\nThe projectile reaches its peak when vertical velocity = 0, halfway through its flight."
            },
            {
                keywords: ['time', 'flight time', 'air time', 'airborne', 'how long', 'duration'], experiment: 'projectile',
                answer: "⏱ Time of Flight: T = (2v × sinθ) / g\n\n• Higher angle → longer flight time\n• Higher velocity → longer flight time\n• Lower gravity → longer flight time\n\nThe projectile spends equal time going up and coming down. Time to peak = T/2."
            },
            {
                keywords: ['mass', 'weight', 'heavy', 'light', 'affect', 'matter', 'does mass'], experiment: 'projectile',
                answer: "⚖️ Mass does NOT affect the trajectory!\n\nIn ideal conditions (no air resistance), a feather and a bowling ball follow the exact same path. This was demonstrated by:\n• Galileo (Leaning Tower of Pisa)\n• Apollo 15 astronauts (on the Moon!)\n\nOnly angle, velocity, and gravity determine the path."
            },
            {
                keywords: ['air resistance', 'drag', 'wind', 'real', 'friction', 'realistic'], experiment: 'projectile',
                answer: "💨 Air Resistance Effects:\n\n• Reduces range significantly\n• Makes trajectory asymmetric (steeper descent)\n• Optimal angle shifts below 45° (~30-40°)\n• Heavier/denser objects affected less\n• Streamlined shapes reduce drag\n\nThis simulation uses ideal conditions for clear physics learning."
            },
            {
                keywords: ['component', 'horizontal', 'vertical', 'x component', 'y component', 'resolve'], experiment: 'projectile',
                answer: "📊 Velocity Components:\n\n• Horizontal: vₓ = v₀·cos(θ) → CONSTANT throughout flight\n• Vertical: vᵧ = v₀·sin(θ) - g·t → changes due to gravity\n\nAt any time t:\n• x = vₓ·t\n• y = vᵧ·t - ½g·t²\n\nAt peak: vᵧ = 0 (momentarily stationary vertically)"
            },
            {
                keywords: ['kinetic energy', 'potential energy', 'energy', 'ke', 'pe'], experiment: 'projectile',
                answer: "⚡ Energy in Projectile Motion:\n\n• Launch: All KE = ½mv²\n• At peak: KE + PE = ½mv²\n  - KE = ½m(v·cosθ)² (horizontal motion)\n  - PE = mgH (height gained)\n• Landing: All KE again = ½mv²\n\nTotal energy is always conserved! KE ↔ PE"
            },
            {
                keywords: ['what is projectile', 'define projectile', 'projectile motion'], experiment: 'projectile',
                answer: "🎯 Projectile Motion is the motion of an object thrown into the air, subject only to gravity.\n\nKey features:\n• No horizontal acceleration (constant horizontal speed)\n• Constant vertical acceleration (g = 9.81 m/s² downward)\n• Parabolic trajectory\n• Independent horizontal & vertical motions\n\nExamples: thrown ball, fired cannonball, jumping athlete"
            },
            {
                keywords: ['launch', 'fire', 'shoot', 'throw', 'how to launch', 'use'], experiment: 'projectile',
                answer: "🚀 To launch the projectile:\n\n1. Set the Launch Angle (0-90°) using the slider\n2. Set Initial Velocity (speed of launch)\n3. Optionally adjust Gravity and Mass\n4. Click the LAUNCH button!\n\nTip: Try 45° for maximum range, then compare with 30° and 60° to see complementary angle symmetry!"
            },

            // ═══════════════════════════════════════════════
            // OHM'S LAW — comprehensive coverage
            // ═══════════════════════════════════════════════
            {
                keywords: ['ohm', 'ohms law', 'v=ir', 'vir', 'formula', 'equation', 'what is ohm'], experiment: 'ohms-law',
                answer: "⚡ Ohm's Law: V = I × R\n\n• V = Voltage (Volts, V) — electrical pressure\n• I = Current (Amperes, A) — electron flow rate\n• R = Resistance (Ohms, Ω) — opposition to flow\n\nRearranged:\n• I = V/R (to find current)\n• R = V/I (to find resistance)"
            },
            {
                keywords: ['resistance', 'resistor', 'ohm', 'oppose', 'impede', 'what is resistance'], experiment: 'ohms-law',
                answer: "🔌 Resistance (R) opposes current flow.\n\nMeasured in Ohms (Ω).\n• Conductors: very low R (copper, silver)\n• Semiconductors: moderate R (silicon)\n• Insulators: very high R (rubber, glass)\n\nFactors affecting R:\n• Material (resistivity)\n• Length (longer = more R)\n• Cross-section area (thicker = less R)\n• Temperature"
            },
            {
                keywords: ['current', 'ampere', 'amp', 'electron', 'flow', 'what is current', 'charge'], experiment: 'ohms-law',
                answer: "💡 Current (I) = flow of electric charge.\n\nMeasured in Amperes (A).\n• I = V/R (from Ohm's Law)\n• 1 Ampere = 1 Coulomb/second\n• 1 Coulomb ≈ 6.24 × 10¹⁸ electrons\n\nCurrent flows from high to low potential (conventional current direction)."
            },
            {
                keywords: ['voltage', 'volt', 'potential', 'emf', 'what is voltage', 'battery', 'pd'], experiment: 'ohms-law',
                answer: "🔋 Voltage (V) = electrical potential difference.\n\nThink of it as 'electrical pressure' that pushes electrons.\n• Battery provides voltage (EMF)\n• 1 Volt = 1 Joule per Coulomb\n• Higher voltage → more current (for same R)\n\nAnalogy: Voltage is like water pressure in a pipe!"
            },
            {
                keywords: ['power', 'watt', 'dissipation', 'heat', 'energy', 'consume', 'hot', 'warm'], experiment: 'ohms-law',
                answer: "🔥 Power = energy consumed per second (Watts)\n\nThree formulas:\n• P = V × I\n• P = I² × R\n• P = V² / R\n\nExamples:\n• 60W bulb at 220V draws 0.27A\n• A 1kΩ resistor at 12V dissipates 0.14W\n\nHigh power → heat generation (that's how heaters work!)"
            },
            {
                keywords: ['series', 'series circuit', 'add resistance', 'one path'], experiment: 'ohms-law',
                answer: "🔗 Series Circuit:\n\n• R_total = R₁ + R₂ + R₃ ...\n• Same current flows through all components\n• Voltage divides across components\n• If one component breaks, entire circuit stops\n\nExample: 10Ω + 20Ω + 30Ω = 60Ω total"
            },
            {
                keywords: ['parallel', 'parallel circuit', 'multiple path', 'branch'], experiment: 'ohms-law',
                answer: "🔗 Parallel Circuit:\n\n• 1/R_total = 1/R₁ + 1/R₂ + 1/R₃ ...\n• Same voltage across all branches\n• Current divides between branches\n• If one branch breaks, others still work\n\nFor two resistors: R_total = (R₁×R₂)/(R₁+R₂)\nParallel resistance is always LESS than the smallest resistor."
            },
            {
                keywords: ['short circuit', 'zero resistance', 'overload', 'fuse', 'breaker'], experiment: 'ohms-law',
                answer: "⚠️ Short Circuit:\n\nWhen R ≈ 0, current → ∞ (extremely high)!\n\nThis causes:\n• Extreme heat generation\n• Wire melting, fires\n• Component damage\n\nProtection devices:\n• Fuses (melt and break circuit)\n• Circuit breakers (trip and disconnect)\n• Ground fault interrupters (GFI/GFCI)"
            },
            {
                keywords: ['graph', 'vi graph', 'v-i', 'linear', 'relationship', 'plot', 'chart'], experiment: 'ohms-law',
                answer: "📈 V-I Graph:\n\nFor ohmic conductors: straight line through origin\n• Slope = Resistance (R)\n• Steeper slope = higher resistance\n\nNon-ohmic devices (curved graphs):\n• Filament lamp (curves up — R increases with temp)\n• Diode (one-way current flow)\n• LED (threshold voltage needed)"
            },
            {
                keywords: ['conductor', 'insulator', 'semiconductor', 'material', 'type'], experiment: 'ohms-law',
                answer: "🔬 Types of Materials:\n\n• Conductors: Very low R — metals (copper, silver, gold, aluminum)\n• Semiconductors: Moderate R — silicon, germanium (basis of electronics!)\n• Insulators: Very high R — rubber, glass, plastic, wood\n• Superconductors: ZERO R at very low temperatures!"
            },
            {
                keywords: ['kirchhoff', 'kcl', 'kvl', 'junction', 'loop rule'], experiment: 'ohms-law',
                answer: "⚡ Kirchhoff's Laws:\n\n1️⃣ KCL (Current Law): Total current entering a junction = total current leaving\n2️⃣ KVL (Voltage Law): Sum of voltages around any closed loop = 0\n\nThese extend Ohm's Law to complex circuits with multiple loops and junctions."
            },
            {
                keywords: ['analogy', 'water', 'pipe', 'explain simply', 'simple', 'easy', 'basic'], experiment: 'ohms-law',
                answer: "💧 Water Pipe Analogy:\n\n• Voltage = Water pressure (push)\n• Current = Water flow rate\n• Resistance = Pipe narrowness\n\nHigher pressure → more flow\nNarrower pipe → less flow\n\nV = I × R is like:\nPressure = Flow × Pipe_Resistance\n\nThis analogy helps visualize electricity!"
            },
            {
                keywords: ['electricity', 'electric', 'what is electricity', 'how does electricity'], experiment: 'ohms-law',
                answer: "⚡ Electricity is the flow of electrons through a conductor.\n\n• Electrons flow from negative to positive terminal\n• Conventional current: positive to negative (historical)\n• Measured by: Voltage (push), Current (flow), Resistance (opposition)\n• Ohm's Law ties them together: V = I × R"
            },

            // ═══════════════════════════════════════════════
            // PENDULUM — comprehensive coverage
            // ═══════════════════════════════════════════════
            {
                keywords: ['period', 'time period', 'formula', 'how long', 'swing time', 'calculate period', 'what is period'], experiment: 'pendulum',
                answer: "⏱ Period Formula: T = 2π × √(L/g)\n\nWhere:\n• T = time for one complete swing (seconds)\n• L = length of string (meters)\n• g = gravity (9.81 m/s² on Earth)\n\n🔑 Key insight: Period does NOT depend on mass or amplitude (for small angles)!"
            },
            {
                keywords: ['length', 'string', 'longer', 'shorter', 'affect', 'change length', 'how does length'], experiment: 'pendulum',
                answer: "📏 Length vs Period: T ∝ √L\n\n• 0.25m → T ≈ 1.0s\n• 1.0m → T ≈ 2.0s (reference!)\n• 4.0m → T ≈ 4.0s\n• 9.0m → T ≈ 6.0s\n\nPattern: Quadrupling length doubles the period.\nThis is because T depends on √L (square root)."
            },
            {
                keywords: ['frequency', 'hertz', 'hz', 'oscillation', 'cycles', 'how many'], experiment: 'pendulum',
                answer: "🔄 Frequency = 1/Period\n\nMeasured in Hertz (Hz) = cycles per second.\n\n• T = 2s → f = 0.5 Hz (once every 2 seconds)\n• T = 1s → f = 1.0 Hz (once per second)\n• T = 0.5s → f = 2.0 Hz (twice per second)\n\nGrandfather clocks use f = 0.5 Hz (T = 2s)."
            },
            {
                keywords: ['small angle', 'approximation', 'accuracy', 'large angle', 'limit'], experiment: 'pendulum',
                answer: "📐 Small Angle Approximation:\n\nT = 2π√(L/g) is accurate only for θ < ~15°!\n\nFor larger angles, the real period is longer:\n• θ = 15° → error ≈ 0.5%\n• θ = 30° → error ≈ 1.7%\n• θ = 45° → error ≈ 4%\n• θ = 90° → error ≈ 18%!\n\nThe exact solution requires elliptic integrals."
            },
            {
                keywords: ['energy', 'kinetic', 'potential', 'conservation', 'ke', 'pe', 'convert'], experiment: 'pendulum',
                answer: "⚡ Energy in a Pendulum:\n\n🔝 At highest point:\n• Max PE = mgh\n• Zero KE (momentarily stopped)\n\n⬇ At lowest point:\n• Max KE = ½mv²\n• Zero PE (reference height)\n\nTotal energy = KE + PE = constant!\nEnergy continuously converts: PE ↔ KE"
            },
            {
                keywords: ['damping', 'friction', 'decay', 'stop', 'amplitude', 'die', 'slow'], experiment: 'pendulum',
                answer: "💨 Damping in Pendulums:\n\nReal pendulums lose energy to:\n• Air resistance (drag)\n• Friction at the pivot\n• Internal friction in the string\n\nEffects:\n• Amplitude decreases over time\n• Period stays roughly the same!\n• Pendulum eventually stops\n\nTypes: underdamped, critically damped, overdamped"
            },
            {
                keywords: ['gravity', 'planet', 'moon', 'mars', 'different gravity', 'g value'], experiment: 'pendulum',
                answer: "🌍 Gravity's Effect on Period:\n\nT = 2π√(L/g), so lower g → longer period.\n\nFor a 1m pendulum:\n• Earth (9.81): T = 2.01s\n• Moon (1.62): T = 4.93s\n• Mars (3.72): T = 3.26s\n• Jupiter (24.79): T = 1.26s\n\nPendulums swing slower on the Moon!"
            },
            {
                keywords: ['clock', 'grandfather', 'timing', 'time keeping', 'tick', 'tock'], experiment: 'pendulum',
                answer: "🕰 Pendulum Clocks:\n\n• Invented by Christiaan Huygens (1656)\n• Use L ≈ 1m for T ≈ 2s (1 tick + 1 tock)\n• Were the most accurate clocks for ~300 years!\n• Temperature changes affect length (and accuracy)\n• Eventually replaced by quartz oscillators"
            },
            {
                keywords: ['what is pendulum', 'define pendulum', 'simple pendulum', 'how does pendulum', 'pendulum work', 'how pendulum'], experiment: 'pendulum',
                answer: "🔔 A Simple Pendulum = mass (bob) on a string, swinging back and forth.\n\nProperties:\n• Period depends on length and gravity ONLY\n• Mass doesn't matter!\n• Follows SHM (Simple Harmonic Motion) for small angles\n• Restoring force: F = -mg·sin(θ)\n\nUsed in: clocks, seismometers, metronomes"
            },
            {
                keywords: ['shm', 'simple harmonic', 'harmonic', 'oscillation', 'oscillate', 'restoring'], experiment: 'pendulum',
                answer: "〰️ Simple Harmonic Motion (SHM):\n\nA pendulum exhibits SHM when:\n• Restoring force ∝ displacement\n• F = -mg·sin(θ) ≈ -mg·θ (small angles)\n• Motion is sinusoidal: θ(t) = θ₀·cos(ωt)\n• ω = 2π/T = √(g/L)\n\nSHM appears in: springs, sound waves, circuits, and more!"
            },
            {
                keywords: ['mass pendulum', 'bob mass', 'weight bob', 'does mass matter', 'heavy bob'], experiment: 'pendulum',
                answer: "⚖️ Mass does NOT affect pendulum period!\n\nT = 2π√(L/g) — no mass (m) in the formula!\n\nWhy? A heavier bob has more gravitational force BUT also more inertia. These two effects exactly cancel out.\n\nSame principle as: ALL objects fall at the same rate (Galileo's discovery)."
            },

            // ═══════════════════════════════════════════════
            // GENERAL PHYSICS — wide coverage
            // ═══════════════════════════════════════════════
            {
                keywords: ['newton', 'newton law', 'laws of motion', 'three laws', 'first law', 'second law', 'third law', 'inertia', 'f=ma'],
                answer: "📚 Newton's Laws of Motion:\n\n1️⃣ Law of Inertia: An object stays at rest or in uniform motion unless acted upon by a force.\n\n2️⃣ F = ma: Force equals mass times acceleration. More force → more acceleration.\n\n3️⃣ Action-Reaction: Every action has an equal and opposite reaction.\n\nThese 3 laws form the foundation of classical mechanics!"
            },
            {
                keywords: ['conservation energy', 'energy conservation', 'energy cannot', 'total energy'],
                answer: "⚡ Law of Conservation of Energy:\n\nEnergy cannot be created or destroyed — only converted!\n\n• Pendulum: PE ↔ KE\n• Projectile: KE ↔ PE + KE\n• Circuit: Electrical → Heat + Light\n• Total energy in any isolated system stays constant.\n\nThis is one of the most fundamental laws in all of physics!"
            },
            {
                keywords: ['gravity', 'gravitational', 'acceleration due', '9.8', '9.81', 'free fall', 'falling'],
                answer: "🌍 Gravitational Acceleration:\n\n• g = 9.81 m/s² on Earth's surface\n• All objects fall at the same rate (in vacuum)\n• g decreases with altitude\n• g varies slightly around Earth (~9.78 to 9.83)\n\nA falling object gains 9.81 m/s of speed every second. After 3 seconds: v = 29.4 m/s ≈ 106 km/h!"
            },
            {
                keywords: ['unit', 'si unit', 'measurement', 'meter', 'kilogram', 'second'],
                answer: "📏 SI Units:\n\n• Length: meter (m)\n• Mass: kilogram (kg)\n• Time: second (s)\n• Force: Newton (N) = kg·m/s²\n• Energy: Joule (J) = N·m\n• Power: Watt (W) = J/s\n• Current: Ampere (A)\n• Voltage: Volt (V) = W/A\n• Resistance: Ohm (Ω) = V/A"
            },
            {
                keywords: ['force', 'what is force', 'push', 'pull', 'types of force'],
                answer: "💪 Force = push or pull on an object.\n\nMeasured in Newtons (N). F = ma.\n\nTypes:\n• Gravitational (weight = mg)\n• Normal (surface reaction)\n• Friction (opposes motion)\n• Tension (in strings/ropes)\n• Air resistance (drag)\n• Electromagnetic\n\n1 Newton ≈ weight of a small apple!"
            },
            {
                keywords: ['acceleration', 'deceleration', 'speed up', 'slow down', 'accelerate'],
                answer: "🏎 Acceleration = rate of change of velocity.\n\na = Δv/Δt (measured in m/s²)\n\n• Positive acceleration: speeding up\n• Negative acceleration (deceleration): slowing down\n• Zero acceleration: constant velocity\n\nF = ma → greater force = greater acceleration"
            },
            {
                keywords: ['friction', 'surface', 'rough', 'smooth', 'static', 'kinetic'],
                answer: "⚙️ Friction opposes relative motion.\n\nTypes:\n• Static friction: prevents motion starting (usually higher)\n• Kinetic friction: opposes ongoing motion\n• μ = coefficient of friction (0 to ~1)\n\nF_friction = μ × Normal force\n\nReducing friction: lubricants, smoother surfaces, wheels"
            },
            {
                keywords: ['work done', 'work energy', 'joule', 'calculate work', 'physics work', 'work formula'],
                answer: "🔨 Work = Force × Distance × cos(θ)\n\nMeasured in Joules (J).\n• Work is done when a force moves an object\n• No displacement = no work (even if force applied!)\n• Work-Energy Theorem: W = ΔKE\n\n1 Joule = 1 Newton × 1 meter"
            },
            {
                keywords: ['momentum', 'impulse', 'mv', 'collision'],
                answer: "🎱 Momentum = mass × velocity (p = mv)\n\n• Measured in kg·m/s\n• Conservation of momentum: total p before = total p after (in collisions)\n• Impulse = Force × time = Δp\n\nTypes of collisions:\n• Elastic: KE conserved (billiard balls)\n• Inelastic: KE lost (car crash)"
            },
            {
                keywords: ['wave', 'wavelength', 'amplitude', 'frequency wave', 'sound', 'light'],
                answer: "🌊 Waves transfer energy without transferring matter.\n\nKey terms:\n• Wavelength (λ): distance between crests\n• Frequency (f): cycles per second\n• Amplitude: maximum displacement\n• Speed: v = f × λ\n\nTypes:\n• Transverse (light, water waves)\n• Longitudinal (sound waves)"
            },
            {
                keywords: ['temperature', 'heat', 'thermal', 'celsius', 'kelvin', 'fahrenheit'],
                answer: "🌡 Temperature = measure of average kinetic energy of particles.\n\nScales:\n• Celsius: water freezes 0°, boils 100°\n• Kelvin: absolute zero = 0K = -273.15°C\n• Fahrenheit: freezes 32°, boils 212°\n\nHeat transfer:\n• Conduction (solids)\n• Convection (fluids)\n• Radiation (electromagnetic)"
            },
            {
                keywords: ['experiment', 'try', 'suggest', 'what should', 'what to do', 'next', 'idea', 'tip'],
                answer: "💡 Experiment Suggestions:\n\n🎯 Projectile: Compare 30° vs 60° (same range!) and see the different trajectories.\n\n⚡ Ohm's Law: Keep voltage fixed at 12V, change resistance from 5Ω to 50Ω — watch current change.\n\n🔔 Pendulum: Set length to 1m (T≈2s), then 4m (T≈4s) — verify T doubles when L quadruples!\n\nExperiment and observe — that's real science! 🔬"
            },
            {
                keywords: ['quiz', 'test', 'score', 'prepare', 'study', 'practice', 'exam'],
                answer: "📝 Quiz Tips:\n\n1. Experiment first — hands-on experience beats memorization\n2. Pay attention to the Formulas panel (right side)\n3. Try changing one variable at a time to see its effect\n4. Note: wrong answers show explanations — learn from them!\n5. You can retake the quiz as many times as you want\n\nYour performance tier updates based on quiz results!"
            },
            {
                keywords: ['scientific method', 'hypothesis', 'experiment method', 'observation'],
                answer: "🔬 The Scientific Method:\n\n1. Observe something interesting\n2. Form a hypothesis (educated guess)\n3. Design an experiment to test it\n4. Collect data and analyze results\n5. Draw conclusions\n6. Repeat and verify!\n\nThat's exactly what you're doing in this virtual lab! 🎓"
            },
            {
                keywords: ['what is physics', 'physics', 'why physics', 'study physics'],
                answer: "🔬 Physics = the study of matter, energy, and the forces of nature.\n\nIt explains:\n• Why things fall (gravity)\n• How circuits work (electricity)\n• Why pendulums swing (mechanics)\n• How the universe works!\n\nThis lab covers 3 key areas:\n• Mechanics (projectile, pendulum)\n• Electricity (Ohm's Law)"
            },
            {
                keywords: ['dimensional analysis', 'dimensions', 'units check', 'unit analysis'],
                answer: "📐 Dimensional Analysis: checking equations using units.\n\nExample: R = v²sin(2θ)/g\n• v² = (m/s)² = m²/s²\n• sin(2θ) = dimensionless\n• g = m/s²\n• R = (m²/s²)/(m/s²) = meters ✓\n\nIf units don't match → formula is wrong!"
            },
            {
                keywords: ['vector', 'scalar', 'magnitude', 'direction'],
                answer: "↗️ Vectors vs Scalars:\n\n• Scalar: magnitude only (speed, mass, energy, temperature)\n• Vector: magnitude + direction (velocity, force, acceleration, displacement)\n\nVector operations:\n• Addition: tip-to-tail method\n• Components: resolved into x and y\n\nIn projectile motion, velocity is a vector with horizontal and vertical components!"
            },
        ];
    }

    // ─── Rule-based hint engine ──────────────────────────

    _getContextHint(exp, param, value, all) {
        if (exp === 'projectile') {
            if (param === 'angle') {
                if (Math.abs(value - 45) < 2) return "✨ 45° gives maximum range on level ground — the 'optimal angle' in projectile motion.";
                if (value > 80) return "⚠️ Very steep angle! The projectile will go mostly upward with very little horizontal range.";
                if (value < 10) return "⚠️ Very shallow angle — the projectile will travel fast but won't stay airborne long.";
                if (Math.abs(value - (90 - (all?.angle || 45))) < 2 && value !== 45) return "🪞 Notice: complementary angles (like 30° and 60°) give the same range — this is the symmetry principle.";
            }
            if (param === 'velocity' && value > 40) return "🚀 High velocity! Energy increases with the square of velocity (KE = ½mv²).";
            if (param === 'gravity' && value < 5) return "🌙 Low gravity — similar to the Moon! Objects stay airborne much longer.";
            if (param === 'mass') return "📝 In ideal projectile motion (no air resistance), mass doesn't affect the trajectory — only angle and velocity matter.";
        }

        if (exp === 'ohms-law') {
            const v = all?.voltage, r = all?.resistance;
            if (param === 'resistance' && value < 5) return "⚠️ Very low resistance — current will be very high. Watch for power dissipation!";
            if (param === 'voltage' && value > 20) return "⚡ High voltage setting. In real circuits, ensure components are rated for this.";
            if (v && r && (v * v / r) > 50) return "🔥 High power dissipation (P > 50W). In real circuits, this would require heat sinking.";
            if (param === 'resistance') return `📝 Ohm's Law: I = V/R. With R = ${value}Ω, current will change proportionally.`;
        }

        if (exp === 'pendulum') {
            if (param === 'length' && value === 1) return "📏 L = 1m gives T ≈ 2.0s on Earth — a convenient reference.";
            if (param === 'length' && value >= 4) return "📐 Long pendulum! The period increases as √L, so 4× length = 2× period.";
            if (param === 'gravity' && value < 5) return "🌙 Reduced gravity: the pendulum will swing more slowly (longer period).";
            if (param === 'damping' && value > 0.3) return "💨 High damping — the pendulum will lose amplitude quickly due to energy dissipation.";
            if (param === 'angle' && value > 30) return "📐 Large angle! The small-angle formula T = 2π√(L/g) becomes less accurate above ~15°.";
        }

        return null;
    }

    _getResultComment(exp, results) {
        if (exp === 'projectile') {
            if (results.range && results.range > 40) return `Impressive range of ${results.range.toFixed(1)}m! Try comparing with complementary angles.`;
            if (results.maxHeight && results.maxHeight > 15) return `Max height of ${results.maxHeight.toFixed(1)}m — that's ${(results.maxHeight / 3.28).toFixed(0)} stories tall!`;
        }
        if (exp === 'ohms-law') {
            if (results.current && results.current > 5) return `${results.current.toFixed(2)}A — that's high current! Power dissipation is ${results.power?.toFixed(1) || '?'}W.`;
        }
        if (exp === 'pendulum') {
            if (results.period) return `Measured period: ${results.period.toFixed(3)}s. Compare with theory: T = 2π√(L/g).`;
        }
        return null;
    }

    _addMessage(text, type = 'info') {
        const body = document.getElementById('ai-body');
        if (!body) return;

        const msg = document.createElement('div');
        msg.className = `ai-message ai-${type}`;
        msg.innerHTML = `<div class="ai-msg-text">${text.replace(/\n/g, '<br>')}</div><div class="ai-msg-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>`;
        body.appendChild(msg);
        body.scrollTop = body.scrollHeight;

        // Keep only last 20 messages
        while (body.children.length > 21) body.removeChild(body.children[1]);
    }

    _pulseToggle() {
        this.toggleBtn.classList.add('pulse');
        setTimeout(() => this.toggleBtn.classList.remove('pulse'), 1500);
    }

    dispose() {
        if (this.panel?.parentElement) this.panel.remove();
        if (this.toggleBtn?.parentElement) this.toggleBtn.remove();
    }
}
