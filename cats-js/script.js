const catButton = document.querySelector("#cat-button");
const dogButton = document.querySelector("#dog-button");
const imageContainer = document.querySelector("#image-container");

catButton.addEventListener("click", () => {
  fetch("https://aws.random.cat/meow")
    .then(response => response.json())
    .then(data => {
      console.log(data);
      const imgUrl = data.file;
      imageContainer.innerHTML = `<img src="${imgUrl}" class="image">`;
    })
    .catch(error => console.error(error));
});




dogButton.addEventListener("click", function() {
  fetch("https://dog.ceo/api/breeds/image/random")
    .then(response => response.json())
    .then(data => {
      const imgUrl = data.message;
      imageContainer.innerHTML = `<img src="${imgUrl}" class="image">`;
    })
    .catch(error => console.error(error));
});
