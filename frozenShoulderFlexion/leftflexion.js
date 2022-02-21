const video5 = document.getElementsByClassName('input_video5')[0];
const out5 = document.getElementsByClassName('output5')[0];
const controlsElement5 = document.getElementsByClassName('control5')[0];
const canvasCtx5 = out5.getContext('2d');
const reps = document.querySelector('.reps');
const sets = document.querySelector('.sets');
const fpsControl = new FPS();

// to keep a counter track
let counter = 0; 
let set_counter = 0;
let up = false, down = false;

// keep a track of range of motion achieved
let maxAngle = 10;
let dayRange = 0;
let rangeforday = document.querySelector('.rangeforday');

const spinner = document.querySelector('.loading');
spinner.ontransitionend = () => {
  spinner.style.display = 'none';
};

function zColor(data) {
  const z = clamp(data.from.z + 0.5, 0, 1);
  return `rgba(0, ${255 * z}, ${255 * (1 - z)}, 1)`;
}

//upper arm and lower left arm
function checkForPerp(obj12, obj14, obj16) {
  const vector1 = [(obj14.x - obj12.x) , (obj14.y - obj12.y)];
  const vector2 = [(obj14.x - obj16.x) , (obj14.y - obj16.y)];

  const dot = vector1[0]*vector2[0] + vector1[1]*vector2[1];

  const mod_a = Math.sqrt(vector1[0]*vector1[0] + vector1[1]*vector1[1]);
  const mod_b = Math.sqrt(vector2[0]*vector2[0] + vector2[1]*vector2[1]);

  const elbowAngle = Math.round((Math.acos(dot/(mod_a*mod_b))*180)/3.14);
  
  // if(elbowAngle < 130) {
  //   console.warn("Keep your arms starigth before beginning " + elbowAngle);
  // }
  
  return elbowAngle;
}

function angleAgainstWall(obj12, obj14) {
  const vector1 = [(obj12.x - obj12.x) , (obj12.y - obj12.y - 0.5)];
  const vector2 = [(obj12.x - obj14.x) , (obj12.y - obj14.y)];

  const dot = vector1[0]*vector2[0] + vector1[1]*vector2[1];

  const mod_a = Math.sqrt(vector1[0]*vector1[0] + vector1[1]*vector1[1]);
  const mod_b = Math.sqrt(vector2[0]*vector2[0] + vector2[1]*vector2[1]);

  const angle = ((Math.acos(dot/(mod_a*mod_b))*180)/3.14).toFixed(2);
  maxAngle = Math.max(maxAngle, angle);

  if(angle <= 95) {
      down = true;
  } 
  else if(angle >= 110) {
      up = true;
  }
  if(up === true && down === true) {
        counter += 1;
        up = false;
        down = false;
        if(counter % 2 === 0) {
          reps.innerHTML = '#reps = ' + counter / 2;
          console.log(maxAngle);
          dayRange += maxAngle;
          maxAngle = 10;
        }
  }
  if(counter / 2 === 5) {
    counter = 0;
    reps.innerHTML = '#reps = ' + Math.trunc(counter);
    set_counter += 1;
    sets.innerHTML = "#sets " + set_counter; 
  } 
  if(set_counter == 3) {
    return (dayRange / (5 * 3)).toFixed(2); 
  }
  return 0;

}

function onResultsPose(results){
  // right arm perpendicular check
  //if angle >= 120, proceed
  let angle = checkForPerp(results.poseLandmarks[12], results.poseLandmarks[14], results.poseLandmarks[16]);
  const rangeAchieved = angleAgainstWall(results.poseLandmarks[12], results.poseLandmarks[14]);
  rangeforday.innerHTML = " Report Card for the day = " + rangeAchieved;
  if(Math.round(angle) <= 130) {
    rangeforday.innerHTML = " Report Card for the day = " + rangeAchieved + "<strong> keep your arms straight </strong>";
  }

  document.body.classList.add('loaded');
  fpsControl.tick();

  canvasCtx5.save();
  canvasCtx5.clearRect(0, 0, out5.width, out5.height);
  canvasCtx5.drawImage(
      results.image, 0, 0, out5.width, out5.height);
      drawConnectors(
        canvasCtx5, results.poseLandmarks, POSE_CONNECTIONS, {
          color: (data) => {
            const x0 = out5.width * data.from.x;
            const y0 = out5.height * data.from.y;
            const x1 = out5.width * data.to.x;
            const y1 = out5.height * data.to.y;
  
            const z0 = clamp(data.from.z + 0.5, 0, 1);
            const z1 = clamp(data.to.z + 0.5, 0, 1);
  
            const gradient = canvasCtx5.createLinearGradient(x0, y0, x1, y1);
            gradient.addColorStop(
                0, `rgb(255, 255, 255)`);
            gradient.addColorStop(
              0, `rgb(255, 255, 255)`);
            return gradient;
          }
        });
    canvasCtx5.restore();
  }

const pose = new Pose({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.2/${file}`;
}});
pose.onResults(onResultsPose);

const camera = new Camera(video5, {
  onFrame: async () => {
    await pose.send({image: video5});
  },
  width: 480,
  height: 480
});
camera.start();

new ControlPanel(controlsElement5, {
      selfieMode: true,
      upperBodyOnly: false,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    })
    .add([
      new StaticText({title: 'MediaPipe Pose'}),
      fpsControl,
      new Toggle({title: 'Selfie Mode', field: 'selfieMode'}),
      new Toggle({title: 'Upper-body Only', field: 'upperBodyOnly'}),
      new Toggle({title: 'Smooth Landmarks', field: 'smoothLandmarks'}),
      new Slider({
        title: 'Min Detection Confidence',
        field: 'minDetectionConfidence',
        range: [0, 1],
        step: 0.01
      }),
      new Slider({
        title: 'Min Tracking Confidence',
        field: 'minTrackingConfidence',
        range: [0, 1],
        step: 0.01
      }),
    ])
    .on(options => {
      video5.classList.toggle('selfie', options.selfieMode);
      pose.setOptions(options);
    });
