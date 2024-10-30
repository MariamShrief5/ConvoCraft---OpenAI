const typingForm = document.querySelector('.typing-form');
const chatList = document.querySelector('.chat-list');
const suggestions = document.querySelectorAll(".suggestion-list .suggestion")
const toggleThemeButton = document.querySelector('#toggle-theme-button');
const deleteButton = document.querySelector("#delete-button")

let userMessage = null;
let isResponseGenerating = false;

//^ API
const API_Key = "AIzaSyDZFncrtzf6zkNiOpcrZDO0wtcJQWagG_g";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_Key}`;

const loadLocalstorageData = () => {
    const savedChats = localStorage.getItem('savedChats');
    const isLightMode = (localStorage.getItem('themeColor') === "light_mode");
    //^ Apply to the stored theme
    document.body.classList.toggle('light_mode' , isLightMode);
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode" ;
    //^ Restore saved chats
    chatList.innerHTML = savedChats || "";
    document.body.classList.toggle("hide-header" , savedChats);    //^ Hide the header once the chat start
    chatList.scrollTo(0 , chatList.scrollHeight);  //^ Scroll to the bottom 
}
loadLocalstorageData();

//^ Create a new message element and return it 
const createMessageElement = (content , ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message" , ...classes);
    div.innerHTML = content;
    return div;
}

//^ Show typing effect by displaying words one by one 
const showTypingEffect = (text , textElement , incomingMessageDiv) =>{
    const words = text.split(' ');
    let currentWordIndex = 0;

    const typingInterval = setInterval(() => {
        //^ Append each word to the text element with a space
        textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];
        incomingMessageDiv.querySelector(".icon").classList.add("hide");

        //^ if all words are displayed
        if(currentWordIndex === words.length){
            clearInterval(typingInterval);
            isResponseGenerating = false;
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            localStorage.setItem('savedChats' , chatList.innerHTML);
            chatList.scrollTo(0 , chatList.scrollHeight);  //^ Scroll to the bottom 
        }
    }, 75);
}

//^ Fetch response from the API based on user message
const generateAPIResponse = async (incomingMessageDiv) => {

    const textElement = incomingMessageDiv.querySelector('.text'); //^ Get text element
    //^ Send POST request to the API with the users message
    try{
        const response = await fetch(API_URL , {
            method : "POST",
            headers: {"Content-Type": "application/json"} , 
            body : JSON.stringify({
                contents : [{
                    role : "user",
                    parts : [{ text : userMessage }]
                }]
            })
        });

        const data = await response.json();
        if(!response.ok) throw new Error(data.error.message);
        // console.log(data);
        //^ Get the API response text
        const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');
        showTypingEffect(apiResponse , textElement , incomingMessageDiv);
    }catch(error){
        isResponseGenerating = false;
        textElement.innerText = error.message;
        textElement.classList.add("error");
    }finally{
        incomingMessageDiv.classList.remove("loading");
    }
}

//^ Show a loading animation while waiting while for the API response
const showLoadingAnimation = () => {
    const html  = `
    <div class="message-content"> 
        <img src="./imgs/gemini.svg" alt="Gemini Photo" class="avatar">
        <p class="text"></p> 
        <div class="loading-indicator"> 
            <div class="loading-bar"></div> 
            <div class="loading-bar"></div> 
            <div class="loading-bar"></div> 
        </div>
        </div> 
        <span onClick="copyMessage(this)" class=" icon material-symbols-rounded">content_copy</span>`;
    
    const incomingMessageDiv = createMessageElement(html , "incoming" , "loading");
    chatList.appendChild(incomingMessageDiv);
    
    chatList.scrollTo(0 , chatList.scrollHeight);  //^ Scroll to the bottom 
    generateAPIResponse(incomingMessageDiv);
}

//^ Copy message text to the clipboard
const copyMessage = (copyIcon) => {
    const messageText = copyIcon.parentElement.querySelector('.text').innerText;

    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done" //^Show tick icon
    setTimeout(() => {
        copyIcon.innerText = "content_copy"
    }, 1000);  //^ Revert icon after 1 sec.
}

//^ Handle sending outgoing chat messages 
const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector('.typing-input').value.trim() || userMessage;
    if(!userMessage || isResponseGenerating)return; //^ Exist if there is no message

    isResponseGenerating = true;
    //* console.log(userMessage);

    const html  = `
    <div class="message-content">
        <img src="./imgs/user.jpg" alt="User Photo" class="avatar">
        <p class="text"></p>
    </div>`;
    
    const outgoingMessageDiv = createMessageElement(html , "outgoing");
    outgoingMessageDiv.querySelector('.text').innerText = userMessage;
    chatList.appendChild(outgoingMessageDiv);

    typingForm.reset(); //^ Clear input value
    chatList.scrollTo(0 , chatList.scrollHeight);  //^ Scroll to the bottom 
    document.body.classList.add("hide-header");    //^ Hide the header once the chat start
    setTimeout(showLoadingAnimation , 500) //^ Show loading Animation after a delay
}

//^ Set userMessage and handle outgoing chat when a suggestion is clicked
suggestions.forEach(suggestion => {
    suggestion.addEventListener('click' , () => {
        userMessage = suggestion.querySelector('.text').innerText;
        handleOutgoingChat();
    });
});

//^ Toggle between light and dark mode
toggleThemeButton.addEventListener('click' , () => {
    const isLightMode =  document.body.classList.toggle('light_mode');
    localStorage.setItem("themeColor" , isLightMode ? "light_mode" : "dark_mode" )
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode" ;
});

//^ Delete all chats from localstorage when user click on remove button
deleteButton.addEventListener('click' , () => {
    if(confirm("Are you sure you want to delete all messages?")){
        localStorage.removeItem("savedChats");
        loadLocalstorageData();
    }
});

typingForm.addEventListener('submit' , (e) => {
    e.preventDefault();
    handleOutgoingChat()
});