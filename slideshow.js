var slideShowID = 0;

class SlideShow{
    constructor(divID, backgroundImages, pattern = {}, timeoutStep = 400, transitionTime = 400, intervalTime = 3000){
        if(!divID || !document.getElementById(divID)){
            throw new Error("The background ID must be provided and be valid.");
        }

        this.ID = slideShowID++;
        this.playing = false;
        this.stop = false;
        this.divID = divID;
        this.itemClass = `${divID}-${this.ID}-block-item block-item`;
        this.lineClass = `${divID}-${this.ID}-block-line block-line`;
        this.backgroundImages = backgroundImages;
        this.pattern = pattern;
        this.timeoutStep = timeoutStep;
        this.transitionTime = transitionTime;
        this.backImageIdx = 0;
        this.intervalTime = intervalTime;
        

        this.columns = 10;
        this.lines = 10;
        this.tuples = this.line * this.columns;

        this.heightBlockDiv = document.getElementById("block").clientHeight;
        this.itemHeight = this.heightBlockDiv / this.lines;

        //Create the tuples
        this.initTuples();

        //Set the foreground and background
        this.initSlideShow();

        //Start the slideshow
        this.start();
    }

    start(){
        if(this.stop){
            return;
        }

        setTimeout(() => this.play(), this.intervalTime);
    }

    resume(){
        this.stop = false;
        this.start();
    }

    pause(){
        this.stop = true;
    }

    setIntervalTime(intervalTime){
        this.intervalTime = intervalTime;
    }

    setTransitionTime(transitionTime){
        this.transitionTime = transitionTime;
    }

    setTimeoutStep(timeoutStep){
        this.timeoutStep = timeoutStep;
    }

    setPattern(pattern){
        this.pattern = pattern;
    }

    setBackgroundImages(backgroundImages){
        this.backgroundImages = backgroundImages;
        this.backImageIdx = 0;

        this.initSlideShow();

        this.start();
    }

    initTuples(){
        let background = document.getElementById(this.divID);
        let tuple, lineDiv;

        for(let i = 0; i < this.lines; i++){
            lineDiv = document.createElement("div");
            lineDiv.className = this.lineClass;
            lineDiv.style.height = `calc(100% / ${this.lines})`;
            
            for(let j = 0; j < this.columns; j++){
                tuple = document.createElement("div");
                tuple.className = this.itemClass;
                lineDiv.appendChild(tuple);
            }
           background.appendChild(lineDiv);
        }  
    }

    initSlideShow(){
        let items = document.getElementsByClassName(this.itemClass);
        let background = document.getElementById(this.divID);
        let nbItems = items.length, item;
        let line, column;

        for(let i = 0; i < nbItems; i++){
            item = items[i];
            column = i % (nbItems/this.lines);
            line = Math.floor(i / this.columns);

            item.style.backgroundPositionX = `${((i % (nbItems/ this.lines)) / ((nbItems/this.lines) - 1)) * 100}%`;

            if(this.backgroundImages[this.backImageIdx].yPosition === "bottom"){
                item.style.backgroundPositionY = `calc(100% + ${(this.lines * this.itemHeight) - ((line + 1) * this.itemHeight)}px)`;
            }else{
                item.style.backgroundPositionY = `calc(50% - ${(line - ((this.lines - 1)/2)) * this.itemHeight}px)`;
            }

            item.style.backgroundSize = `${(nbItems / this.lines) * 100}%`;
            item.style.width = `calc(100% / ${this.columns})`;
            item.style.backgroundImage = `url(${this.backgroundImages[this.backImageIdx].src})`;
        }

        background.style.backgroundImage = `url(${this.backgroundImages[this.backImageIdx + 1].src})`;
        background.style.backgroundPositionY = this.backgroundImages[this.backImageIdx + 1].yPosition;;
    }

    setItemsImages(){
        let background = document.getElementById(this.divID);
        let items = document.getElementsByClassName(this.itemClass);
        let nbItems = items.length;
        let item, column, line;

        return new Promise((resolve) => {
            setTimeout(() => {
                this.backImageIdx = (this.backImageIdx + 1) >= this.backgroundImages.length ? 0 : this.backImageIdx + 1;
                let nextImageIdx =  (this.backImageIdx + 1) >= this.backgroundImages.length ? 0 : this.backImageIdx + 1;
                
                for(let i = 0; i < items.length; i++){
                    item = items[i];
                    column = i % (nbItems/this.lines);
                    line = Math.floor(i / this.columns);
                    
                    if(this.backgroundImages[this.backImageIdx].yPosition === "bottom"){
                        item.style.backgroundPositionY = `calc(100% + ${(this.lines * this.itemHeight) - ((line + 1) * this.itemHeight)}px)`;
                    }else{
                        item.style.backgroundPositionY = `calc(50% - ${(line - ((this.lines - 1)/2)) * this.itemHeight}px)`;
                    }

                    item.style.backgroundImage = `url(${this.backgroundImages[this.backImageIdx].src})`;
                    item.style.transition = "opacity 0s linear";
                    item.style.opacity = "1";
                    item.style.filter  = 'alpha(opacity=1)'; // IE fallback
                }
    
                setTimeout(() => {
                    background.style.backgroundImage = `url(${this.backgroundImages[nextImageIdx].src})`;
                    background.style.backgroundPositionY = this.backgroundImages[nextImageIdx].yPosition;
                    resolve("OK");
                }, 100)
    
            }, this.transitionTime);
        });
    }

    createItemPromises(){
        let promisesArr = [];
        let divs = document.getElementsByClassName(this.itemClass);

        this.buildPattern();

        let randValues = generatePattern.run(divs.length, this.pattern, {lines: this.lines, columns: this.columns});
        
        for(let i = 0; i < divs.length; i++){
            promisesArr.push(new Promise((resolve) => {
                let localDiv = divs[i];
                setTimeout(() => {
                    localDiv.style.transition = `opacity ${this.transitionTime / 1000}s linear`;
                    localDiv.style.opacity = "0";
                    localDiv.style.filter  = 'alpha(opacity=0)'; // IE fallback
                    resolve();
                }, randValues[i] * this.timeoutStep);
            }));
        }
        return promisesArr;
    }

    play(){
        if(this.playing){
            return true;
        }

        this.playing = true;
            
        Promise.all(this.createItemPromises()).then(() => {
            return this.setItemsImages();
        }).then((txt) => {
            this.playing = false;
            this.start();
        });
    }

    buildPattern(){
        if(this.pattern.sweep && this.pattern.alternateSweep){
            if(this.pattern.verticalSweep){
                this.pattern.fromTop = (this.backImageIdx % 2 === 0);
            }else{
                this.pattern.fromRight = (this.backImageIdx % 2 === 0);
            }
        }
        if(this.pattern.corner && this.pattern.alternateCorner){
            this.pattern.topLeftCorner = (this.backImageIdx % 2 === 0);
        }
    }
}


let generatePattern = {
    run(size, options = {}, params){
        let randNumbersArray = [...new Array(size)].map((_, i) => (i + 1));

        switch (true) {
            case options.progressive === true: return this.generateProgressive(randNumbersArray, options.fromRight);
            case options.sweep === true:   return this.generateSweep(size, options, params); 
            case options.corner === true:  return this.generateTopRight(size, options.topLeftCorner, params);
        
            default: return this.random(randNumbersArray, size, options.unique);
        }
    },

    generateProgressive(randNumbersArray, fromRight){
        return  fromRight ? randNumbersArray.reverse() : randNumbersArray;
    },

    generateSweep(size, options, params){
        let column, line;
        let outputArr = [];
    
        for(let i = 0; i < size; i++){
            column = i % (size / params.lines);
            line = Math.floor(i / params.columns);

            if(options.verticalSweep){
                outputArr.push(options.fromTop ? params.lines - 1 - line : line);
            }else{
                outputArr.push(options.fromRight ? params.columns - 1 - column : column);
            }
        }
        return outputArr;
    },

    generateTopRight(size, topLeftCorner, params){
        let column, line;
        let outputArr = [];
    
        for(let i = 0; i < size; i++){
            column = i % (size / params.lines);
            line = Math.floor(i / params.columns);
            outputArr.push(topLeftCorner ? (column * line) : ((params.lines - 1) * (params.columns - 1)) - (column * line));
        }

        return outputArr;
    },

    random(randNumbersArray, size, unique){
        let randIdx, outputArr = [];

        for(let i = 0; i < size; i++){
            randIdx = Math.floor(Math.random() * randNumbersArray.length);
            if(unique){
                outputArr.push(...randNumbersArray.splice(randIdx, 1));
            }else{
                outputArr.push(randNumbersArray[randIdx]);
            }
        }
            
        return outputArr;
    }
}

function initEvents(){
    document.getElementById("block").addEventListener("mouseenter", (ev) => {
        slideShow.pause();
    });
    document.getElementById("block").addEventListener("mouseleave", () => {
        slideShow.resume();
    });
}

function initSliderButton(defaultParameters){
    var sliderInterval = document.getElementById("slider-button-interval");
    var outputInterval = document.getElementById("slider-output-interval");
    sliderInterval.setAttribute("value", defaultParameters.interval / 1000);
    outputInterval.innerHTML = sliderInterval.value; // Display the default slider value
    
    // Update the current slider value (each time you drag the slider handle)
    sliderInterval.oninput = function() {
        outputInterval.innerHTML = this.value;
        slideShow.setIntervalTime(this.value * 1000);
    }

    var sliderTransition = document.getElementById("slider-button-transition");
    var outputTransition = document.getElementById("slider-output-transition");
    sliderTransition.setAttribute("value", defaultParameters.transitionTime);
    outputTransition.innerHTML = sliderTransition.value; // Display the default slider value
    
    // Update the current slider value (each time you drag the slider handle)
    sliderTransition.oninput = function() {
        outputTransition.innerHTML = this.value;
        slideShow.setTransitionTime(this.value);
    }

    var sliderStep = document.getElementById("slider-button-step");
    var outputStep = document.getElementById("slider-output-step");
    sliderStep.setAttribute("value", defaultParameters.timeoutStep);
    outputStep.innerHTML = sliderStep.value; // Display the default slider value
    
    // Update the current slider value (each time you drag the slider handle)
    sliderStep.oninput = function() {
        outputStep.innerHTML = this.value;
        slideShow.setTimeoutStep(this.value);
    }

    for(let btn of document.getElementById("btn-group").children){
        btn.addEventListener(("click"), (event) => {
            let patternName = event.target.getAttribute("value");
            if(patternMap.has(patternName)){
                selectPattern(patternName);
                slideShow.setPattern(patternMap.get(patternName));
            }
            
        });
    };
}

function selectPattern(patternName){
    let patternButtons = document.getElementById("btn-group").children;
    for(let btn of patternButtons){
        btn.getAttribute("value") === patternName ? btn.classList.add("selected") : btn.classList.remove("selected");
    }
}

var slideShow;
let defaultParameters = {timeoutStep: 30, transitionTime: 900,interval: 2000};
let defaultPattern = "horizontalSweep";
let patternMap = new Map();
patternMap.set("random", {});
patternMap.set("progressive", {progressive: true});
patternMap.set("horizontalSweep", {sweep: true, alternateSweep: true});
patternMap.set("verticalSweep", {sweep: true, alternateSweep: true, verticalSweep: true});
patternMap.set("corner", {corner: true, alternateCorner: true});

let images = [
    [
        {src: "./img/background-sydney.jpg", yPosition: "bottom"}, 
        {src: "./img/background-desert.jpg", yPosition: "center"},
        {src: "./img/background-lighthouse.jpg", yPosition: "center"},
        {src: "./img/background-moutain.jpg", yPosition: "center"},
    ],[
        {src: "./img/background-moutain-2.jpg", yPosition: "center"},
        //{src: "./img/background-white.jpg", yPosition: "center"},
        {src: "./img/background-moutain-3.jpg", yPosition: "center"},
        {src: "./img/background-moutain-4.jpg", yPosition: "center"},
    ],[
        {src: "./img/background-newyork.jpg", yPosition: "center"},
        {src: "./img/background-losangeles.jpg", yPosition: "center"},
        {src: "./img/background-toronto.jpg", yPosition: "center"},
    ]
];
let defaultImageSetIndex = 0;

function selectImageSet(idx){
    
    let sets = document.getElementById("image-sets").children;
    let set;

    slideShow.setBackgroundImages(images[idx]);

    for(let i = 0; i < sets.length; i++){ 
        set = sets[i];
        idx === i ? set.classList.add("selected") : set.classList.remove("selected");
    };
}

function initImagesSet(){
    let mapSet = document.getElementById("image-sets");
    let imageSet, imageNumber;

    for(let i = 0; i < images.length; i++){
        imageSet = document.createElement("div");
        imageSet.className = "image-set";
        imageSet.style.backgroundImage = `url(${images[i][0].src})`;
        imageSet.addEventListener("click", selectImageSet.bind(this, i));
        if(i === defaultImageSetIndex){
            imageSet.classList.add("selected");
        }

        imageNumber = document.createElement("div");
        imageNumber.className = "number-images";
        imageNumber.innerHTML = `+${images[i].length}`;

        imageSet.appendChild(imageNumber);
        mapSet.appendChild(imageSet);
    }        
}

document.addEventListener("DOMContentLoaded", function(event) {
    initImagesSet();

    //Init events 
    initEvents();

    initSliderButton(defaultParameters);

    selectPattern(defaultPattern);
    
    slideShow = new SlideShow("block", images[defaultImageSetIndex], patternMap.get(defaultPattern), defaultParameters.timeoutStep, defaultParameters.transitionTime, defaultParameters.interval);

    //let slideShow1 = new SlideShow("bluck", imagesPath[1], patternMap.get("horizontalSweep"), 15, 1000, 2000);
});