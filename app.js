// API Configuration
const API_URL = 'http://localhost:5000/api/predict';
const OCR_API_URL = 'http://localhost:5000/api/ocr';
const OCR_PREDICT_API_URL = 'http://localhost:5000/api/ocr_predict';
const API_BASE_URL = 'http://localhost:5000/api';

// State Management
let currentTool = 'toxicity';
let currentText = '';
let analysisHistory = [];
let chart = null;
let pastedImageFile = null; // Store pasted image file

// Initialize App
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// ============================================
// INITIALIZATION
// ============================================

// ============================================
// BLOCKCHAIN-STYLE 3D BACKGROUND
// ============================================

function setupBlockchainBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Node system
    const nodes = [];
    const connections = [];
    const nodeCount = 50;
    const maxDistance = 200;
    
    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
        nodes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: 2 + Math.random() * 3,
            type: Math.random() > 0.7 ? 'toxic' : 'safe',
            pulse: Math.random() * Math.PI * 2
        });
    }
    
    // Mouse tracking
    let mouseX = canvas.width / 2;
    let mouseY = canvas.height / 2;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    // Animation loop
    function animate() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw nodes
        nodes.forEach((node, i) => {
            // Update position
            node.x += node.vx;
            node.y += node.vy;
            
            // Bounce off edges
            if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
            if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
            
            // Keep in bounds
            node.x = Math.max(0, Math.min(canvas.width, node.x));
            node.y = Math.max(0, Math.min(canvas.height, node.y));
            
            // Mouse interaction
            const dx = mouseX - node.x;
            const dy = mouseY - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150) {
                const force = (150 - distance) / 150;
                node.x -= (dx / distance) * force * 2;
                node.y -= (dy / distance) * force * 2;
            }
            
            // Pulse animation
            node.pulse += 0.02;
            const pulseRadius = node.radius + Math.sin(node.pulse) * 1;
            
            // Draw node
            const gradient = ctx.createRadialGradient(
                node.x, node.y, 0,
                node.x, node.y, pulseRadius * 3
            );
            
            if (node.type === 'toxic') {
                gradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
                gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.4)');
                gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
            } else {
                gradient.addColorStop(0, 'rgba(46, 204, 113, 0.8)');
                gradient.addColorStop(0.5, 'rgba(46, 204, 113, 0.4)');
                gradient.addColorStop(1, 'rgba(46, 204, 113, 0)');
            }
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(node.x, node.y, pulseRadius * 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw core
            ctx.fillStyle = node.type === 'toxic' ? '#EF4444' : '#2ECC71';
            ctx.beginPath();
            ctx.arc(node.x, node.y, pulseRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Find and draw connections
            for (let j = i + 1; j < nodes.length; j++) {
                const otherNode = nodes[j];
                const dx = node.x - otherNode.x;
                const dy = node.y - otherNode.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < maxDistance) {
                    const opacity = (1 - distance / maxDistance) * 0.3;
                    const lineGradient = ctx.createLinearGradient(
                        node.x, node.y,
                        otherNode.x, otherNode.y
                    );
                    
                    if (node.type === 'toxic' || otherNode.type === 'toxic') {
                        lineGradient.addColorStop(0, `rgba(239, 68, 68, ${opacity})`);
                        lineGradient.addColorStop(1, `rgba(239, 68, 68, ${opacity * 0.5})`);
                    } else {
                        lineGradient.addColorStop(0, `rgba(46, 204, 113, ${opacity})`);
                        lineGradient.addColorStop(1, `rgba(46, 204, 113, ${opacity * 0.5})`);
                    }
                    
                    ctx.strokeStyle = lineGradient;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(node.x, node.y);
                    ctx.lineTo(otherNode.x, otherNode.y);
                    ctx.stroke();
                    
                    // Animated data flow
                    if (Math.random() > 0.95) {
                        const progress = Math.sin(Date.now() * 0.005 + i + j) * 0.5 + 0.5;
                        const flowX = node.x + (otherNode.x - node.x) * progress;
                        const flowY = node.y + (otherNode.y - node.y) * progress;
                        
                        ctx.fillStyle = node.type === 'toxic' ? '#EF4444' : '#2ECC71';
                        ctx.beginPath();
                        ctx.arc(flowX, flowY, 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
        });
        
        requestAnimationFrame(animate);
    }
    
    // Handle resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
    
    // Start animation
    animate();
    
    // Create floating particles
    createFloatingParticles();
}

function createFloatingParticles() {
    const container = document.getElementById('particles-container');
    if (!container) return;
    
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = `particle ${Math.random() > 0.8 ? 'toxic' : 'safe'}`;
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 8 + 's';
        particle.style.animationDuration = (6 + Math.random() * 4) + 's';
        container.appendChild(particle);
    }
}

function initializeApp() {
    try {
        setupBlockchainBackground();
        setupSidebar();
        setupToolSwitching();
        setupToxicityChecker();
        setupOCR();
        setupDashboard();
        loadHistory();
        updateDashboard();
        
        // Set up auto-sync for dashboard
        setupAutoSync();
        
        console.log('✅ ToxiScan Pro initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing ToxiScan Pro:', error);
        showToast('Application failed to initialize', 'error');
    }
}

// ============================================
// SIDEBAR & NAVIGATION
// ============================================

function setupSidebar() {
    const toggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
}

function setupToolSwitching() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tool = item.dataset.tool;
            switchTool(tool);
            
            // Update active states
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

function switchTool(tool) {
    currentTool = tool;
    
    // Hide all views
    document.querySelectorAll('.tool-view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show selected view
    const view = document.getElementById(`${tool}-view`);
    if (view) {
        view.classList.add('active');
    }
    
    // Update dashboard when switching to it
    if (tool === 'dashboard') {
        // Force reload from API immediately when switching to dashboard
        loadHistory().then(() => {
            // Force replace to get fresh data from API
            autoSyncHistory(true); // forceReplace = true for immediate fresh data
            updateDashboard();
        });
    }
}

// ============================================
// TOXICITY CHECKER
// ============================================

function setupToxicityChecker() {
    const textEditor = document.getElementById('text-editor');
    const analyzeBtn = document.getElementById('analyze-btn');
    const clearBtn = document.getElementById('clear-btn');
    const exampleBtn = document.getElementById('example-btn');
    
    // Character & word count
    if (textEditor) {
        textEditor.addEventListener('input', updateTextStats);
        
        // Handle paste
        textEditor.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            insertTextAtCursor(textEditor, text);
            updateTextStats();
        });
    }
    
    // Analyze button
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', handleAnalyze);
    }
    
    // Clear button
    if (clearBtn) {
        clearBtn.addEventListener('click', clearEditor);
    }
    
    // Example button
    if (exampleBtn) {
        exampleBtn.addEventListener('click', loadExample);
    }
}

function updateTextStats() {
    const textEditor = document.getElementById('text-editor');
    if (!textEditor) return;
    
    const text = textEditor.textContent.trim();
    const wordCount = text ? text.split(/\s+/).filter(w => w.length > 0).length : 0;
    const charCount = text.length;
    
    const wordCountEl = document.getElementById('word-count');
    const charCountEl = document.getElementById('char-count');
    
    if (wordCountEl) wordCountEl.textContent = `${wordCount} word${wordCount !== 1 ? 's' : ''}`;
    if (charCountEl) charCountEl.textContent = `${charCount} character${charCount !== 1 ? 's' : ''}`;
}

function insertTextAtCursor(element, text) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        element.textContent += text;
    }
}

function clearEditor() {
    const textEditor = document.getElementById('text-editor');
    if (textEditor) {
        textEditor.textContent = '';
        updateTextStats();
        resetToxicityResults();
    }
}

function loadExample() {
    const examples = [
        "This is a normal comment that should be safe.",
        "You're an idiot and I hate you!",
        "I think we should discuss this matter professionally.",
        "This product is terrible and you should feel bad for making it."
    ];
    
    const textEditor = document.getElementById('text-editor');
    if (textEditor) {
        const randomExample = examples[Math.floor(Math.random() * examples.length)];
        textEditor.textContent = randomExample;
        updateTextStats();
    }
}

async function handleAnalyze() {
    const textEditor = document.getElementById('text-editor');
    if (!textEditor) return;
    
    const text = textEditor.textContent.trim();
    
    if (!text) {
        showToast('Please enter some text to analyze', 'warning');
        return;
    }

    await analyzeText(text);
}

function analyzeTextLocally(text) {
    const analyzeBtn = document.getElementById('analyze-btn');
    showLoading('Analyzing text...');

    if (analyzeBtn) {
        analyzeBtn.classList.add('loading');
    }

    try {
        // Simple keyword-based toxicity analysis
        const toxicWords = [
            'hate', 'stupid', 'idiot', 'dumb', 'moron', 'asshole', 'bastard', 'shit', 'fuck', 'damn',
            'bitch', 'crap', 'suck', 'terrible', 'awful', 'horrible', 'worst', 'pathetic', 'loser',
            'kill', 'die', 'death', 'murder', 'rape', 'abuse', 'violence', 'threat', 'attack',
            'racist', 'sexist', 'homophobic', 'bigot', 'prejudice', 'discrimination', 'hate speech'
        ];

        const severeWords = [
            'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'kill', 'die', 'murder', 'rape', 'abuse'
        ];

        const textLower = text.toLowerCase();
        let toxicScore = 0;
        let severeScore = 0;
        let insultScore = 0;
        let threatScore = 0;
        let obsceneScore = 0;

        // Count toxic words
        toxicWords.forEach(word => {
            const count = (textLower.match(new RegExp(word, 'g')) || []).length;
            toxicScore += count * 0.1;
        });

        // Count severe words (higher weight)
        severeWords.forEach(word => {
            const count = (textLower.match(new RegExp(word, 'g')) || []).length;
            severeScore += count * 0.3;
            obsceneScore += count * 0.4;
        });

        // Check for insults (words ending with common insult patterns)
        if (/\b\w+(?:ing|er|est|ed)\s+(?:stupid|dumb|idiot|moron|loser|pathetic)\b/i.test(textLower)) {
            insultScore += 0.2;
        }

        // Check for threats
        if (/\b(?:i'?ll|will|going to)\s+(?:kill|hurt|attack|destroy|ruin)\b/i.test(textLower)) {
            threatScore += 0.4;
        }

        // Check for repeated punctuation (anger indicator)
        const repeatedPunct = (text.match(/[!@#$%^&*()]{2,}/g) || []).length;
        toxicScore += repeatedPunct * 0.05;

        // Check for ALL CAPS (shouting)
        const capsRatio = text.replace(/[^A-Z]/g, '').length / text.replace(/[^a-zA-Z]/g, '').length;
        if (capsRatio > 0.7 && text.length > 10) {
            toxicScore += 0.2;
        }

        // Normalize scores
        toxicScore = Math.min(toxicScore, 1);
        severeScore = Math.min(severeScore, 1);
        insultScore = Math.min(insultScore, 1);
        threatScore = Math.min(threatScore, 1);
        obsceneScore = Math.min(obsceneScore, 1);

        // Determine overall rating and severity
        let rating = 'Clean';
        let severity = 'low';

        if (toxicScore >= 0.6) {
            rating = 'Highly Toxic';
            severity = 'high';
        } else if (toxicScore >= 0.3) {
            rating = 'Mildly Toxic';
            severity = 'medium';
        } else if (toxicScore >= 0.1) {
            rating = 'Slightly Toxic';
            severity = 'low';
        }

        const data = {
            scores: {
                toxic: toxicScore,
                severe_toxic: severeScore,
                obscene: obsceneScore,
                threat: threatScore,
                insult: insultScore,
                identity_hate: 0 // Not implemented in simple version
            },
            rating: rating,
            severity: severity
        };

        // Store in history
        addToHistory(text, data);

        // Display results
        displayToxicityResults(data, text);

    } catch (error) {
        console.error('Analysis error:', error);
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        hideLoading();
        if (analyzeBtn) {
            analyzeBtn.classList.remove('loading');
        }
    }
}

async function analyzeText(text) {
    // Use local analysis instead of API call
    analyzeTextLocally(text);
}

function displayToxicityResults(data, originalText) {
    const placeholder = document.querySelector('#toxicity-results .results-placeholder');
    const resultsContent = document.getElementById('toxicity-results-content');
    
    if (!placeholder || !resultsContent) return;
    
    // Hide placeholder, show results
    placeholder.classList.add('hidden');
    resultsContent.classList.remove('hidden');
    
    // Update overall score
    updateOverallScore(data);

    // Create chart
    setTimeout(() => {
        createChart(data.scores || {});
    }, 300);
    
    // Update categories
    updateCategories(data.scores || {});
    
    // Update issues
    updateIssues(data.scores || {});
}

function updateOverallScore(data) {
    const toxicScore = data.scores?.toxic || 0;
    const percentage = Math.round(toxicScore * 100);
    
    // Update badge
    const scoreBadge = document.getElementById('score-badge');
    if (scoreBadge) {
        let badgeText = 'Clean';
        let badgeClass = 'safe';
        
        if (data.rating) {
            badgeText = data.rating;
            if (data.severity === 'high' || badgeText.includes('Highly')) {
                badgeClass = 'toxic';
            } else if (data.severity === 'medium' || badgeText.includes('Mildly')) {
                badgeClass = 'warning';
            }
        } else {
            if (toxicScore >= 0.6) {
                badgeText = 'Highly Toxic';
                badgeClass = 'toxic';
            } else if (toxicScore >= 0.3) {
                badgeText = 'Mildly Toxic';
                badgeClass = 'warning';
            }
        }
        
        scoreBadge.textContent = badgeText;
        scoreBadge.className = `score-badge ${badgeClass}`;
    }
    
    // Update meter
    const meterFill = document.getElementById('meter-fill');
    const meterText = document.getElementById('meter-text');
    
    if (meterFill) {
        meterFill.style.width = `${percentage}%`;
        meterFill.className = `meter-fill ${data.severity === 'high' ? 'toxic' : data.severity === 'medium' ? 'warning' : ''}`;
    }
    
    if (meterText) {
        meterText.textContent = `${percentage}%`;
    }
}

function updateCategories(scores) {
    const categoriesList = document.getElementById('categories-list');
    if (!categoriesList || !scores) return;
    
    categoriesList.innerHTML = '';
    
    Object.entries(scores).forEach(([label, value]) => {
        const item = document.createElement('div');
        item.className = 'category-item';
        
        const labelEl = document.createElement('div');
        labelEl.className = 'category-label';
        labelEl.textContent = label.replace('_', ' ').toUpperCase();
        
        const valueEl = document.createElement('div');
        valueEl.className = 'category-value';
        const percentage = Math.round(value * 100);
        valueEl.textContent = `${percentage}%`;
        
        if (percentage >= 60) {
            valueEl.classList.add('high');
        } else if (percentage >= 30) {
            valueEl.classList.add('medium');
        } else {
            valueEl.classList.add('low');
        }
        
        item.appendChild(labelEl);
        item.appendChild(valueEl);
        categoriesList.appendChild(item);
    });
}

function updateIssues(scores) {
    const issuesList = document.getElementById('issues-list');
    if (!issuesList || !scores) return;
    
    issuesList.innerHTML = '';
    
    const highRiskCategories = Object.entries(scores)
        .filter(([label, value]) => value >= 0.3)
        .sort((a, b) => b[1] - a[1]);
    
    if (highRiskCategories.length === 0) {
        issuesList.innerHTML = '<div class="issue-item">✅ No toxic content detected. Your text appears to be clean!</div>';
        return;
    }
    
    highRiskCategories.forEach(([label, value]) => {
        const item = document.createElement('div');
        item.className = 'issue-item';
        const percentage = Math.round(value * 100);
        
        if (percentage >= 60) {
            item.classList.add('toxic');
        }
        
        item.textContent = `⚠️ ${label.replace('_', ' ').toUpperCase()}: ${percentage}% confidence`;
        issuesList.appendChild(item);
    });
}

function resetToxicityResults() {
    const placeholder = document.querySelector('#toxicity-results .results-placeholder');
    const resultsContent = document.getElementById('toxicity-results-content');
    
    if (placeholder) placeholder.classList.remove('hidden');
    if (resultsContent) resultsContent.classList.add('hidden');
    
    if (chart) {
        chart.destroy();
        chart = null;
    }
}

// ============================================
// CHART CREATION
// ============================================

function createChart(scores) {
    if (typeof Chart === 'undefined') {
        console.log('Chart.js not loaded yet, retrying...');
        setTimeout(() => createChart(scores), 100);
        return;
    }

    const chartCanvas = document.getElementById('chart-canvas');
    if (!chartCanvas) {
        console.error('Chart canvas not found');
        return;
    }

    const ctx = chartCanvas.getContext('2d');

    // Destroy existing chart
    if (chart) {
        chart.destroy();
    }

    if (!scores || Object.keys(scores).length === 0) {
        console.log('No scores to display in chart');
        return;
    }

    console.log('Creating chart with scores:', scores);

    const labels = Object.keys(scores);
    const values = Object.values(scores);

    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(l => l.replace('_', ' ').toUpperCase()),
            datasets: [{
                label: 'Toxicity Score',
                data: values,
                backgroundColor: values.map(v => {
                    if (v >= 0.6) return 'rgba(239, 68, 68, 0.8)';
                    if (v >= 0.3) return 'rgba(251, 191, 36, 0.8)';
                    return 'rgba(46, 204, 113, 0.8)';
                }),
                borderColor: values.map(v => {
                    if (v >= 0.6) return '#EF4444';
                    if (v >= 0.3) return '#F59E0B';
                    return '#2ECC71';
                }),
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            indexAxis: 'y', // Horizontal bars
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1A1A1A',
                    bodyColor: '#6B7280',
                    borderColor: '#E5E7EB',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return `Score: ${(context.parsed.x * 100).toFixed(1)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 1,
                    ticks: {
                        color: '#6B7280',
                        font: { size: 12 },
                        callback: function(value) {
                            return (value * 100).toFixed(0) + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    ticks: {
                        color: '#1A1A1A',
                        font: { size: 11, weight: '600' },
                        maxRotation: 0, // No rotation
                        minRotation: 0  // No rotation
                    },
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1200,
                easing: 'easeOutQuart'
            }
        }
    });

    console.log('Chart created successfully');
}

// ============================================
// OCR FUNCTIONALITY
// ============================================

function setupOCR() {
    const imageInput = document.getElementById('image-input');
    const uploadTrigger = document.getElementById('upload-trigger');
    const uploadArea = document.getElementById('ocr-upload-area');
    const removeBtn = document.getElementById('remove-image-btn');
    const extractBtn = document.getElementById('extract-btn');
    const analyzeExtractedBtn = document.getElementById('analyze-extracted-btn');
    const copyBtn = document.getElementById('copy-text-btn');
    
    // File input
    if (imageInput && uploadTrigger) {
        uploadTrigger.addEventListener('click', () => imageInput.click());
        imageInput.addEventListener('change', (e) => handleImageSelect(e));
    }
    
    // Drag and drop
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                handleImageFile(file);
            }
        });
    }
    
    // Paste image from clipboard
    const handlePaste = (e) => {
        // Only handle paste when OCR view is active
        if (currentTool !== 'ocr') return;
        
        const items = e.clipboardData?.items;
        if (!items || items.length === 0) return;
        
        // Look for image in clipboard
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.indexOf('image') !== -1) {
                e.preventDefault();
                e.stopPropagation();
                
                const blob = item.getAsFile();
                if (blob) {
                    // Convert blob to File object
                    const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type });
                    // Store the pasted file globally so handleExtractText can access it
                    pastedImageFile = file;
                    handleImageFile(file);
                    showToast('Image pasted from clipboard!', 'success');
                }
                return; // Exit after processing first image
            }
        }
    };
    
    // Add paste listener to document
    document.addEventListener('paste', handlePaste);
    
    // Also add to upload area for better UX
    if (uploadArea) {
        uploadArea.addEventListener('paste', handlePaste);
    }
    
    // Remove image
    if (removeBtn) {
        removeBtn.addEventListener('click', clearImage);
    }
    
    // Extract text
    if (extractBtn) {
        extractBtn.addEventListener('click', handleExtractText);
    }
    
    // Analyze extracted text
    if (analyzeExtractedBtn) {
        analyzeExtractedBtn.addEventListener('click', handleAnalyzeExtracted);
    }
    
    // Copy text
    if (copyBtn) {
        copyBtn.addEventListener('click', copyExtractedText);
    }
}

function handleImageSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        handleImageFile(file);
    }
}

function handleImageFile(file) {
    if (file.size > 10 * 1024 * 1024) {
        showToast('Image size must be less than 10MB', 'error');
        return;
    }
    
    // Store file globally for pasted images
    pastedImageFile = file;
    
    displayImagePreview(file);
    resetOCRResults();
    
    // Buttons are always enabled - validation handles the logic
    // This allows users to click and see helpful messages
}

function displayImagePreview(file) {
    const reader = new FileReader();
    const uploadContent = document.getElementById('upload-content');
    const previewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const imageInput = document.getElementById('image-input');
    
    reader.onload = (e) => {
        if (imagePreview) imagePreview.src = e.target.result;
        if (uploadContent) uploadContent.classList.add('hidden');
        if (previewContainer) previewContainer.classList.remove('hidden');
    };
    
    reader.readAsDataURL(file);
    
    // Store file for later use
    if (imageInput) {
        imageInput.dataset.file = JSON.stringify({ name: file.name, size: file.size });
    }
}

function clearImage() {
    const imageInput = document.getElementById('image-input');
    const uploadContent = document.getElementById('upload-content');
    const previewContainer = document.getElementById('image-preview-container');
    
    // Clear pasted file
    pastedImageFile = null;
    
    if (imageInput) {
        imageInput.value = '';
        delete imageInput.dataset.file;
    }
    if (uploadContent) uploadContent.classList.remove('hidden');
    if (previewContainer) previewContainer.classList.add('hidden');
    
    resetOCRResults();
}

async function handleExtractText() {
    const imageInput = document.getElementById('image-input');
    // Check for pasted file first, then fallback to input file
    const imageFile = pastedImageFile || (imageInput && imageInput.files[0]);

    if (!imageFile) {
        showToast('Please select an image to analyze', 'warning');
        return;
    }

    const extractBtn = document.getElementById('extract-btn');
    showLoading('Extracting text from image...');

    if (extractBtn) {
        extractBtn.classList.add('loading');
    }

    try {
        // Use Tesseract.js for client-side OCR
        const result = await Tesseract.recognize(imageFile, 'eng', {
            logger: m => console.log(m) // Optional: log progress
        });

        const extractedText = result.data.text.trim();

        if (!extractedText) {
            showToast('No text detected in the image', 'warning');
            return;
        }

        displayExtractedText(extractedText);

    } catch (error) {
        console.error('OCR extraction error:', error);
        showToast(`Error extracting text: ${error.message}`, 'error');
    } finally {
        hideLoading();
        if (extractBtn) {
            extractBtn.classList.remove('loading');
        }
    }
}

async function handleAnalyzeExtracted() {
    // First check if there's an image
    const imageInput = document.getElementById('image-input');
    const imageFile = pastedImageFile || (imageInput && imageInput.files[0]);
    
    if (!imageFile) {
        showToast('Please select an image to analyze', 'warning');
        return;
    }
    
    // Then check if text has been extracted
    const extractedText = document.getElementById('extracted-text-display')?.textContent.trim();
    
    if (!extractedText) {
        showToast('Please extract text from image first', 'warning');
        return;
    }
    
    await analyzeExtractedTextForOCR(extractedText);
}

function analyzeExtractedTextForOCRLocal(text) {
    const analyzeBtn = document.getElementById('analyze-extracted-btn');
    showLoading('Analyzing extracted text...');

    if (analyzeBtn) {
        analyzeBtn.classList.add('loading');
    }

    try {
        // Use the same local analysis as the main toxicity checker
        const toxicWords = [
            'hate', 'stupid', 'idiot', 'dumb', 'moron', 'asshole', 'bastard', 'shit', 'fuck', 'damn',
            'bitch', 'crap', 'suck', 'terrible', 'awful', 'horrible', 'worst', 'pathetic', 'loser',
            'kill', 'die', 'death', 'murder', 'rape', 'abuse', 'violence', 'threat', 'attack',
            'racist', 'sexist', 'homophobic', 'bigot', 'prejudice', 'discrimination', 'hate speech'
        ];

        const severeWords = [
            'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'kill', 'die', 'murder', 'rape', 'abuse'
        ];

        const textLower = text.toLowerCase();
        let toxicScore = 0;
        let severeScore = 0;
        let insultScore = 0;
        let threatScore = 0;
        let obsceneScore = 0;

        // Count toxic words
        toxicWords.forEach(word => {
            const count = (textLower.match(new RegExp(word, 'g')) || []).length;
            toxicScore += count * 0.1;
        });

        // Count severe words (higher weight)
        severeWords.forEach(word => {
            const count = (textLower.match(new RegExp(word, 'g')) || []).length;
            severeScore += count * 0.3;
            obsceneScore += count * 0.4;
        });

        // Check for insults (words ending with common insult patterns)
        if (/\b\w+(?:ing|er|est|ed)\s+(?:stupid|dumb|idiot|moron|loser|pathetic)\b/i.test(textLower)) {
            insultScore += 0.2;
        }

        // Check for threats
        if (/\b(?:i'?ll|will|going to)\s+(?:kill|hurt|attack|destroy|ruin)\b/i.test(textLower)) {
            threatScore += 0.4;
        }

        // Check for repeated punctuation (anger indicator)
        const repeatedPunct = (text.match(/[!@#$%^&*()]{2,}/g) || []).length;
        toxicScore += repeatedPunct * 0.05;

        // Check for ALL CAPS (shouting)
        const capsRatio = text.replace(/[^A-Z]/g, '').length / text.replace(/[^a-zA-Z]/g, '').length;
        if (capsRatio > 0.7 && text.length > 10) {
            toxicScore += 0.2;
        }

        // Normalize scores
        toxicScore = Math.min(toxicScore, 1);
        severeScore = Math.min(severeScore, 1);
        insultScore = Math.min(insultScore, 1);
        threatScore = Math.min(threatScore, 1);
        obsceneScore = Math.min(obsceneScore, 1);

        // Determine overall rating and severity
        let rating = 'Clean';
        let severity = 'low';

        if (toxicScore >= 0.6) {
            rating = 'Highly Toxic';
            severity = 'high';
        } else if (toxicScore >= 0.3) {
            rating = 'Mildly Toxic';
            severity = 'medium';
        } else if (toxicScore >= 0.1) {
            rating = 'Slightly Toxic';
            severity = 'low';
        }

        const data = {
            scores: {
                toxic: toxicScore,
                severe_toxic: severeScore,
                obscene: obsceneScore,
                threat: threatScore,
                insult: insultScore,
                identity_hate: 0 // Not implemented in simple version
            },
            rating: rating,
            severity: severity
        };

        // Store in history
        addToHistory(text, data);

        // Display results in OCR panel
        displayOCRToxicityResults(data, text);

    } catch (error) {
        console.error('OCR Analysis error:', error);
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        hideLoading();
        if (analyzeBtn) {
            analyzeBtn.classList.remove('loading');
        }
    }
}

async function analyzeExtractedTextForOCR(text) {
    // Use local analysis instead of API call
    analyzeExtractedTextForOCRLocal(text);
}

function displayOCRToxicityResults(data, originalText) {
    const toxicitySection = document.getElementById('ocr-toxicity-section');
    if (!toxicitySection) return;
    
    // Show toxicity section
    toxicitySection.classList.remove('hidden');
    
    // Update overall score
    updateOCROverallScore(data);
    
    // Create chart
    setTimeout(() => {
        createOCRChart(data.scores || {});
    }, 300);
    
    // Update categories
    updateOCRCategories(data.scores || {});
    
    // Update issues
    updateOCRIssues(data.scores || {});
}

function updateOCROverallScore(data) {
    const toxicScore = data.scores?.toxic || 0;
    const percentage = Math.round(toxicScore * 100);
    
    // Update badge
    const scoreBadge = document.getElementById('ocr-score-badge');
    if (scoreBadge) {
        let badgeText = 'Clean';
        let badgeClass = 'safe';
        
        if (data.rating) {
            badgeText = data.rating;
            if (data.severity === 'high' || badgeText.includes('Highly')) {
                badgeClass = 'toxic';
            } else if (data.severity === 'medium' || badgeText.includes('Mildly')) {
                badgeClass = 'warning';
            }
        } else {
            if (toxicScore >= 0.6) {
                badgeText = 'Highly Toxic';
                badgeClass = 'toxic';
            } else if (toxicScore >= 0.3) {
                badgeText = 'Mildly Toxic';
                badgeClass = 'warning';
            }
        }
        
        scoreBadge.textContent = badgeText;
        scoreBadge.className = `score-badge ${badgeClass}`;
    }
    
    // Update meter
    const meterFill = document.getElementById('ocr-meter-fill');
    const meterText = document.getElementById('ocr-meter-text');
    
    if (meterFill) {
        meterFill.style.width = `${percentage}%`;
        meterFill.className = `meter-fill ${data.severity === 'high' ? 'toxic' : data.severity === 'medium' ? 'warning' : ''}`;
    }
    
    if (meterText) {
        meterText.textContent = `${percentage}%`;
    }
}

function updateOCRCategories(scores) {
    const categoriesList = document.getElementById('ocr-categories-list');
    if (!categoriesList || !scores) return;
    
    categoriesList.innerHTML = '';

    Object.entries(scores).forEach(([label, value]) => {
        const item = document.createElement('div');
        item.className = 'category-item';
        
        const labelEl = document.createElement('div');
        labelEl.className = 'category-label';
        labelEl.textContent = label.replace('_', ' ').toUpperCase();
        
        const valueEl = document.createElement('div');
        valueEl.className = 'category-value';
        const percentage = Math.round(value * 100);
        valueEl.textContent = `${percentage}%`;
        
        if (percentage >= 60) {
            valueEl.classList.add('high');
        } else if (percentage >= 30) {
            valueEl.classList.add('medium');
        } else {
            valueEl.classList.add('low');
        }
        
        item.appendChild(labelEl);
        item.appendChild(valueEl);
        categoriesList.appendChild(item);
    });
}

function updateOCRIssues(scores) {
    const issuesList = document.getElementById('ocr-issues-list');
    if (!issuesList || !scores) return;
    
    issuesList.innerHTML = '';
    
    const highRiskCategories = Object.entries(scores)
        .filter(([label, value]) => value >= 0.3)
        .sort((a, b) => b[1] - a[1]);
    
    if (highRiskCategories.length === 0) {
        issuesList.innerHTML = '<div class="issue-item">✅ No toxic content detected. Your text appears to be clean!</div>';
        return;
    }
    
    highRiskCategories.forEach(([label, value]) => {
        const item = document.createElement('div');
        item.className = 'issue-item';
        const percentage = Math.round(value * 100);
        
        if (percentage >= 60) {
            item.classList.add('toxic');
        }
        
        item.textContent = `⚠️ ${label.replace('_', ' ').toUpperCase()}: ${percentage}% confidence`;
        issuesList.appendChild(item);
    });
}

let ocrChart = null;

function createOCRChart(scores) {
    if (typeof Chart === 'undefined') {
        setTimeout(() => createOCRChart(scores), 100);
        return;
    }
    
    const chartCanvas = document.getElementById('ocr-chart-canvas');
    if (!chartCanvas) return;
    
    const ctx = chartCanvas.getContext('2d');
    
    // Destroy existing chart
    if (ocrChart) {
        ocrChart.destroy();
    }
    
    if (!scores || Object.keys(scores).length === 0) return;
    
    const labels = Object.keys(scores);
    const values = Object.values(scores);
    
    ocrChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(l => l.replace('_', ' ').toUpperCase()),
            datasets: [{
                label: 'Toxicity Score',
                data: values,
                backgroundColor: values.map(v => {
                    if (v >= 0.6) return 'rgba(239, 68, 68, 0.8)';
                    if (v >= 0.3) return 'rgba(251, 191, 36, 0.8)';
                    return 'rgba(46, 204, 113, 0.8)';
                }),
                borderColor: values.map(v => {
                    if (v >= 0.6) return '#EF4444';
                    if (v >= 0.3) return '#F59E0B';
                    return '#2ECC71';
                }),
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            indexAxis: 'y', // Horizontal bars
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1A1A1A',
                    bodyColor: '#6B7280',
                    borderColor: '#E5E7EB',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return `Score: ${(context.parsed.x * 100).toFixed(1)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 1,
                    ticks: {
                        color: '#6B7280',
                        font: { size: 12 },
                        callback: function(value) {
                            return (value * 100).toFixed(0) + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    ticks: {
                        color: '#1A1A1A',
                        font: { size: 11, weight: '600' },
                        maxRotation: 0, // No rotation
                        minRotation: 0  // No rotation
                    },
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1200,
                easing: 'easeOutQuart'
            }
        }
    });
}

function displayExtractedText(text) {
    const placeholder = document.querySelector('#ocr-results .results-placeholder');
    const resultsContent = document.getElementById('ocr-results-content');
    const extractedDisplay = document.getElementById('extracted-text-display');
    
    if (extractedDisplay) {
        extractedDisplay.textContent = text;
    }
    
    if (placeholder) placeholder.classList.add('hidden');
    if (resultsContent) resultsContent.classList.remove('hidden');
}

function copyExtractedText() {
    const extractedDisplay = document.getElementById('extracted-text-display');
    if (!extractedDisplay) return;
    
    const text = extractedDisplay.textContent;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Text copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy text', 'error');
    });
}

function resetOCRResults() {
    const placeholder = document.querySelector('#ocr-results .results-placeholder');
    const resultsContent = document.getElementById('ocr-results-content');
    const toxicitySection = document.getElementById('ocr-toxicity-section');
    const extractedDisplay = document.getElementById('extracted-text-display');
    
    // Clear extracted text display
    if (extractedDisplay) {
        extractedDisplay.textContent = '';
    }
    
    if (placeholder) placeholder.classList.remove('hidden');
    if (resultsContent) resultsContent.classList.add('hidden');
    if (toxicitySection) toxicitySection.classList.add('hidden');
    
    // Reset chart
    if (ocrChart) {
        ocrChart.destroy();
        ocrChart = null;
    }
}

// ============================================
// DASHBOARD
// ============================================

function setupDashboard() {
    const clearBtn = document.getElementById('clear-history-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearHistory);
    }
}

// Auto-sync setup
let autoSyncInterval = null;

function setupAutoSync() {
    // Auto-sync every 200ms (0.2 seconds) when dashboard is active for faster real-time updates
    autoSyncInterval = setInterval(() => {
        if (currentTool === 'dashboard') {
            autoSyncHistory();
        }
    }, 200); // Reduced to 200ms for even faster near real-time updates
    
    // Listen for custom history update events (including clears)
    window.addEventListener('historyUpdated', (event) => {
        // Always sync immediately on history update, even if not on dashboard
        const forceReplace = event.detail?.forceReplace || false;
        // Immediately sync from API on history update
        loadHistory().then(() => {
            autoSyncHistory(forceReplace);
        });
    });
    
    // Listen for storage events (for cross-tab synchronization)
    window.addEventListener('storage', (e) => {
        if (e.key === 'toxicityAnalysisHistory') {
            console.log('[Dashboard] localStorage changed, syncing...');
            // Always sync when storage changes
            loadHistory().then(() => {
                autoSyncHistory(true); // Force replace when storage changes
            });
        }
    });
    
    // Poll immediately when page becomes visible (user switches back to tab)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && currentTool === 'dashboard') {
            console.log('[Dashboard] Page became visible, syncing immediately...');
            autoSyncHistory(true); // Force replace to get latest data
        }
    });
}

async function loadHistory() {
    try {
        // Always try to fetch from API first
        try {
            const response = await fetch(`${API_BASE_URL}/history/get`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.history) {
                    analysisHistory = data.history || [];
                    console.log('[History] Loaded', analysisHistory.length, 'entries from API');
                    // Save to localStorage as backup
                    saveHistory();
                    
                    // Update dashboard if it's active
                    if (currentTool === 'dashboard') {
                        updateDashboard();
                    }
                    return;
                } else {
                    console.warn('[History] API returned invalid data:', data);
                }
            } else {
                console.warn('[History] API fetch failed with status:', response.status);
            }
        } catch (apiError) {
            console.warn('[History] API fetch error, using localStorage:', apiError.message || apiError);
        }
        
        // Fallback to localStorage
        const stored = localStorage.getItem('toxicityAnalysisHistory');
        if (stored) {
            analysisHistory = JSON.parse(stored);
            console.log('[History] Loaded', analysisHistory.length, 'entries from localStorage');
        } else {
            analysisHistory = [];
            console.log('[History] No history found in localStorage');
        }
    } catch (error) {
        console.error('Error loading history:', error);
        analysisHistory = [];
    }
}

async function autoSyncHistory(forceReplace = false) {
    try {
        // Add cache-busting parameter to ensure fresh data
        const response = await fetch(`${API_BASE_URL}/history/get?t=${Date.now()}`, {
            cache: 'no-store'
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const apiData = await response.json();
        
        if (!apiData.success) {
            throw new Error('Invalid API response: success=false');
        }
        
        // API history - explicitly ensure it's an array (empty array is valid!)
        const apiHistory = Array.isArray(apiData.history) ? apiData.history : [];
        const previousLength = analysisHistory.length;
        
        // CRITICAL: If API is empty but we have local data, this means a clear happened - use replace mode!
        const stored = localStorage.getItem('toxicityAnalysisHistory');
        let localHistory = [];
        try {
            localHistory = stored ? JSON.parse(stored) : [];
            if (!Array.isArray(localHistory)) localHistory = [];
        } catch (e) {
            localHistory = [];
        }
        
        // Detect clear: API is empty array but local has data
        const isClearDetected = Array.isArray(apiHistory) && apiHistory.length === 0 && Array.isArray(localHistory) && localHistory.length > 0;
        const shouldForceReplace = forceReplace || isClearDetected;
        
        console.log('[History] Sync check:', {
            apiLength: apiHistory.length,
            localLength: localHistory.length,
            isClearDetected,
            shouldForceReplace,
            forceReplace
        });
        
        // If forceReplace OR API is empty (clear detected), use API data directly
        if (shouldForceReplace) {
            // Sort by timestamp (most recent first) - even if empty
            const sortedHistory = Array.isArray(apiHistory) ? [...apiHistory].sort((a, b) => {
                const timeA = new Date(a.timestamp || 0).getTime();
                const timeB = new Date(b.timestamp || 0).getTime();
                return timeB - timeA;
            }) : [];
            
            // Limit to 50 entries (will be empty if cleared)
            analysisHistory = sortedHistory.slice(0, 50);
            
            // CRITICAL: Save empty array to localStorage to clear local data
            saveHistory();
            
            if (isClearDetected) {
                console.log('[History] 🗑️ CLEAR DETECTED! API is empty but local had', previousLength, 'entries. Replacing with empty.');
            } else {
                console.log('[History] Replaced with API data. Total entries:', analysisHistory.length, '(was', previousLength + ')');
            }
            
            // Always update dashboard when forceReplace (especially for clears)
            if (currentTool === 'dashboard') {
                updateDashboard();
            }
        } else {
            // Otherwise, merge with local history (only when API has data)
            
            // Merge histories - create a map by ID to avoid duplicates
            const historyMap = new Map();
            
            // Add local entries first
            localHistory.forEach(entry => {
                if (entry.id) {
                    historyMap.set(entry.id, entry);
                }
            });
            
            // Add/update with API entries (API entries take precedence)
            apiHistory.forEach(entry => {
                if (entry.id) {
                    historyMap.set(entry.id, entry);
                }
            });
            
            // Convert back to array and sort by timestamp (most recent first)
            const mergedHistory = Array.from(historyMap.values()).sort((a, b) => {
                const timeA = new Date(a.timestamp || 0).getTime();
                const timeB = new Date(b.timestamp || 0).getTime();
                return timeB - timeA;
            });
            
            // Limit to 50 entries
            analysisHistory = mergedHistory.slice(0, 50);
            
            // Save merged history
            saveHistory();
            
            // Log if there was a change
            if (analysisHistory.length !== previousLength) {
                console.log('[History] Auto-synced. Total entries:', analysisHistory.length, '(was', previousLength + ')');
            }
        }
        
        // Always update dashboard if it's active (whether forceReplace or merge)
        if (currentTool === 'dashboard') {
            updateDashboard();
        }
        
        // Special logging for clear detection
        if (shouldForceReplace && previousLength > 0 && apiHistory.length === 0) {
            console.log('[History] Clear detected! API is empty, replaced local history');
        }
    } catch (error) {
        console.error('[History] Auto-sync error:', error);
        // Silently fail - we don't want to spam errors
    }
}

function saveHistory() {
    try {
        localStorage.setItem('toxicityAnalysisHistory', JSON.stringify(analysisHistory));
    } catch (error) {
        console.error('Error saving history:', error);
    }
}

async function addToHistory(text, data) {
    const entry = {
        id: Date.now(),
        text: text.substring(0, 100),
        fullText: text,
        timestamp: new Date().toISOString(),
        rating: data.rating || 'Unknown',
        severity: data.severity || 'low',
        scores: data.scores || {}
    };
    
    analysisHistory.unshift(entry);
    
    // Keep only last 50 entries
    if (analysisHistory.length > 50) {
        analysisHistory = analysisHistory.slice(0, 50);
    }
    
    console.log('[History] Added entry:', entry.text.substring(0, 50), 'Total entries:', analysisHistory.length);
    
    // Save to localStorage first
    saveHistory();
    
    // Dispatch event for immediate update
    try {
        window.dispatchEvent(new CustomEvent('historyUpdated'));
    } catch (e) {
        // Event dispatch might fail in some contexts, ignore
    }
    
    // Also try to save to API (async, don't wait)
    try {
        const response = await fetch(`${API_BASE_URL}/history/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(entry),
        });
        
        if (response.ok) {
            console.log('[History] Saved to API');
        }
    } catch (apiError) {
        // Silently fail - API might not be available
        console.debug('[History] API save failed (non-critical):', apiError);
    }
    
    // Always try to update dashboard (it will only render if dashboard is active)
    updateDashboard();
    
    // Trigger auto-sync after a short delay to ensure API has processed the entry
    setTimeout(() => {
        if (currentTool === 'dashboard') {
            autoSyncHistory();
        }
    }, 500);
}

function updateDashboard() {
    // Always update dashboard data, but only render if dashboard is active
    const safePercent = document.getElementById('safe-percent');
    const toxicPercent = document.getElementById('toxic-percent');
    const totalAnalyses = document.getElementById('total-analyses');
    const historyList = document.getElementById('history-list');
    
    // If dashboard view is not active, don't update DOM (but data is still saved)
    if (currentTool !== 'dashboard') {
        return;
    }
    
    console.log('[Dashboard] Updating dashboard with', analysisHistory.length, 'entries');
    
    if (!analysisHistory || analysisHistory.length === 0) {
        if (safePercent) safePercent.textContent = '0%';
        if (toxicPercent) toxicPercent.textContent = '0%';
        if (totalAnalyses) totalAnalyses.textContent = '0';
        if (historyList) {
            historyList.innerHTML = '<div class="history-empty"><p>No analysis history yet. Start analyzing to see results here.</p></div>';
        }
        return;
    }
    
    const total = analysisHistory.length;
    const safe = analysisHistory.filter(e => e.severity === 'low').length;
    const toxic = total - safe;
    
    const safePercentValue = Math.round((safe / total) * 100);
    const toxicPercentValue = Math.round((toxic / total) * 100);
    
    console.log('[Dashboard] Stats:', { total, safe, toxic, safePercentValue, toxicPercentValue });
    
    if (safePercent) safePercent.textContent = `${safePercentValue}%`;
    if (toxicPercent) toxicPercent.textContent = `${toxicPercentValue}%`;
    if (totalAnalyses) totalAnalyses.textContent = total;
    
    // Update history list
    if (historyList) {
        historyList.innerHTML = analysisHistory.map(entry => `
            <div class="history-item severity-${entry.severity || 'low'}">
                <div class="history-content">
                    <p class="history-text">${escapeHtml(entry.text)}${entry.text.length < entry.fullText.length ? '...' : ''}</p>
                    <div class="history-meta">
                        <span class="history-rating ${entry.severity || 'low'}">${entry.rating}</span>
                        <span class="history-time">${formatTime(entry.timestamp)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

async function clearHistory() {
    if (confirm('Are you sure you want to clear all analysis history?')) {
        try {
            // Clear local storage first (works without backend)
            analysisHistory = [];
            saveHistory();

            // Try to clear from API (optional - don't fail if it doesn't work)
            try {
                const response = await fetch(`${API_BASE_URL}/history/clear`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('[History] API cleared successfully:', result);
                } else {
                    console.log('[History] API clear failed, but local storage cleared successfully');
                }
            } catch (apiError) {
                console.log('[History] API not available, but local storage cleared successfully');
            }

            // Dispatch event to notify other tabs/components (mark as clear event)
            try {
                window.dispatchEvent(new CustomEvent('historyUpdated', {
                    detail: { forceReplace: true }
                }));
            } catch (e) {
                // Event dispatch might fail in some contexts, ignore
            }

            // Update dashboard immediately
            updateDashboard();
            showToast('History cleared successfully', 'success');
        } catch (error) {
            console.error('[History] Error clearing history:', error);
            showToast('Failed to clear history: ' + (error.message || 'Unknown error'), 'error');
        }
    }
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showLoading(text = 'Processing...') {
    const overlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    
    if (loadingText) loadingText.textContent = text;
    if (overlay) overlay.classList.remove('hidden');
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastIcon = toast.querySelector('.toast-icon');
    const toastMessage = toast.querySelector('.toast-message');
    const toastClose = toast.querySelector('.toast-close');
    
    if (!toast || !toastMessage) return;
    
    // Set icon based on type
    if (toastIcon) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        toastIcon.textContent = icons[type] || icons.info;
    }
    
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 5000);
    
    // Close button
    if (toastClose) {
        toastClose.onclick = () => toast.classList.add('hidden');
    }
}
