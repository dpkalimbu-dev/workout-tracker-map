'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout{
    date = new Date();
    id = (Date.now() + '').slice(-10);
    clicks = 0;

    constructor(coords, distance, duration){
        this.coords = coords; // [lat, lng]
        this.distance = distance; // in km
        this.duration = duration; // in min
        
    }

     _setDescription(){
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
         this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }

    
    click(){
        this.clicks++;
    }
}

class Running extends Workout{
     type = 'running';
    constructor(coords, distance, duration, cadence){
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }

    calcPace(){
        // min/km
        this.pace = this.duration/this.distance;
        return this.pace;
    }
}
class Cycling extends Workout{
    type = 'cycling';
    constructor(coords, distance, duration, elevation){
        super(coords, distance, duration);
        this.elevation = elevation;
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed(){
        // km/h
        this.speed = this.distance / (this.duration / 60 );
        return this.speed;
    }
}


class App{
     #map;
     #mapZoomLevel = 13;
     #mapEvent;
     #workouts = [];

    constructor(){
        // Get users position
        this._getPosition();

        // Get data from local storage
        this._getLocalStorage();

        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);  
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    }

    _getPosition(){
if(navigator.geolocation)
navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),
    function(){
    alert('Could not get your position')
});
    }

    _loadMap(position){
    const {latitude} = position.coords;
    const {longitude} = position.coords;
    // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    
   this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(this.#map);



// Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
            this._renderWorkoutMarker(work);
        });

}
    
    _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

    _hideForm(){
        //Empty inputs
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value =
      '';

      form.style.display = 'none';
      form.classList.add('hidden');
      setTimeout(() => (form.style.display = 'grid'), 1000);
    }
    _toggleElevationField(){
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout(e){
        const validInputs =  (...inputs)=> inputs.every(inp => Number.isFinite(inp));
        // All arguments are collected into one array called (inputs) .every() checks all elements in an array
        // Returns true only if every element passes the test
        // Returns false if even one fails
        const allPositive = (...inputs) => inputs.every(inp => inp > 0);
        e.preventDefault();

        // Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;
        
        
        // If workout running, create running object
        if(type === 'running'){
            const cadence = +inputCadence.value;
            // Check if data is valid
            if(
            !validInputs(distance, duration, cadence) ||
            !allPositive(distance, duration, cadence)
            )
             return alert('Input have to be positive numbers!');

             workout = new Running([lat, lng], distance, duration, cadence);
           
        }
        // If workout cycling, create running object
        if(type === 'cycling'){
            const elevation = +inputElevation.value;
            if(
                !validInputs(distance, duration, elevation) ||
                !allPositive(distance, elevation)
            )
            return alert ('Input have to be positive numbers!');
            workout = new Cycling([lat, lng], distance, duration, elevation); 
        }

        // Add new object to workout array
        this.#workouts.push(workout);
        
        // Render workout on map as marker
        this._renderWorkoutMarker(workout);
        
        // Render workout on list 
        this._renderWorkout(workout);
        
        //Hide form + clear input fields
        this._hideForm();     
        
        // Set local storage to all workouts
        this._setLocalStorage();
    };


_renderWorkoutMarker(workout){
    L.marker(workout.coords)
    .addTo(this.#map)
    .bindPopup(L.popup({
        maxWidth : 250,
        minWidth : 100,
        autoClose : false,
        closeOnClick : false,
        className : `${workout.type}-popup`,
    }))
    .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
    .openPopup();
    }

    _renderWorkout(workout){
         let html =`
          <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
          <span class="workout__icon">${workout.type === 'running'? '🏃‍♂️': '🚴‍♀️'}</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
          </div>`;

            if(workout.type === 'running') html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
            <span class="workout__delete"><b>×</b></span> 
            </div>  
            `;

             if(workout.type === 'cycling') html += `
             <div class="workout__details">
             <span class="workout__icon">⚡️</span>
             <span class="workout__value">${workout.speed.toFixed(1)}</span>
             <span class="workout__unit">km/h </span>
             </div>
          <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevation}</span>
          <span class="workout__unit">m </span>
          <span class="workout__delete"><b>×</b></span> 
          </div>
             `;
       
       form.insertAdjacentHTML('afterend', html);
    }

    _moveToPopup(e){
        const workoutEl = e.target.closest('.workout');
        console.log(workoutEl);

        if (!workoutEl) return;

       if (e.target.closest('.workout__delete')
) {
    this._deleteWorkout(workoutEl);
    return; // Stop here so the map doesn't try to move to a deleted workout
  }

  // 2. Otherwise, move the map (your existing logic)
  const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);
  this.#map.setView(workout.coords, this.#mapZoomLevel, {
    animate: true,
    pan: { duration: 1 },
  });

    }

    _deleteWorkout(workoutEl) {
  // 1. Remove from the data array
  this.#workouts = this.#workouts.filter(work => work.id !== workoutEl.dataset.id);

  // 2. Remove from the UI (Sidebar)
  workoutEl.remove();

  // 3. Update Local Storage
  this._setLocalStorage();

  // 4. Reload to clear map markers 
  location.reload(); 
}

    _setLocalStorage(){
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    _getLocalStorage() {
  const data = JSON.parse(localStorage.getItem('workouts'));
  if (!data) return;

  this.#workouts = data.map(work => {
    let workout;

    if (work.type === 'running') {
      workout = new Running(
        work.coords,
        work.distance,
        work.duration,
        work.cadence
      );
    }

    if (work.type === 'cycling') {
      workout = new Cycling(
        work.coords,
        work.distance,
        work.duration,
        work.elevation
      );
    }

    // Restore saved properties
    workout.id = work.id;
    workout.date = new Date(work.date);
    workout.clicks = work.clicks || 0;

    return workout;
  });

  this.#workouts.forEach(work => {
    this._renderWorkout(work);
  });
}


    reset(){
        localStorage.removeItem('workouts');
        location.reload();
    }
}

const app =  new App();

