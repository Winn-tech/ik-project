

const mediaDetails = async (media_type,media_id)=>{
const url = `https://api.themoviedb.org/3/${media_type}/${media_id}?language=en-US`;
const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxYTYxODc4NjllOWYxNzFjYmYwN2U0OWU1Y2QxZWUzOCIsIm5iZiI6MTY2OTg5ODc5OC43ODQ5OTk4LCJzdWIiOiI2Mzg4YTIyZTIyOWFlMjE1NWM1NTY2YmUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.u-gjRnxAjY4CHWOoIpkyNsO54bhx8e1ZqnajQYYvZBo'
  }
};
try {
const response = await fetch(url, options)

if (!response.ok) {
  throw new Error(`HTTP error! Status: ${response.status}`);
}
const data = await response.json();
return data; 
} catch (err) {
console.error("Error fetching media details:", err);
return null; 
}

}

module.exports ={mediaDetails}