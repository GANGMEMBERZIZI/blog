function parseContent(text) {
    let safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    safeText = safeText.replace(/\[FILE_CONTENT_START:\s*(.*?)\][\s\S]*?\[FILE_CONTENT_END\]/g, '<div style="display:inline-block; padding:4px 8px; background:#2d2d2d; color:#10a37f; border-radius:4px; font-size:12px; margin:4px 0; border: 1px solid #10a37f;">📄 附件代码: $1 (已解析)</div>');
    safeText = safeText.replace(/!\[.*?\]\((.*?)\)/g, '<img src="$1" style="max-width:200px; border-radius:8px; display:block; margin-top:5px;" />');
    return safeText.replace(/\n/g, '<br/>');
}
class AIchat extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        const iconArrow = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>`;
        const iconStop = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="7" width="10" height="10" rx="1.5"/></svg>`;
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = `<div class="maintopic">
         <div class="chatTitle">
         <h2>Sena Chat</h2>
         <img src="./img/3b7c81d119bd352045f7cf7c7de1d220-removebg-preview.png" alt="" class="chattitle">
    </div>
    <div class="chatbox">
        </div>
    <div class="input-area">
        <input type="file" id="fileInput" multiple style="display: none;">
        <button id="uploadBtn" style="background: none; border: none; cursor: pointer; font-size: 20px; padding-right: 10px;">
            📎
        </button>
        <textarea id="chatInput" placeholder="和星奏说点什么吧... (Shift + Enter 换行)" rows="1"></textarea>
        <button id="sendBtn" class="ai-send-btn">
        </button>
    </div>
    </div>`;
        const sendBtn = shadow.querySelector("#sendBtn");
        const uploadBtn = shadow.querySelector("#uploadBtn");
        const fileInput = shadow.querySelector("#fileInput");
        const chatInput = shadow.querySelector("#chatInput");
        const chatbox = shadow.querySelector(".chatbox");
        const sheet = new CSSStyleSheet();
        sendBtn.innerHTML = iconArrow;
        uploadBtn?.addEventListener('click', () => {
            fileInput?.click();
        });
        let isGenerating = false;
        let currentControl = null;
        const aichat = async () => {
            try {
                const userMessage = chatInput.value;
                const files = fileInput.files;
                if (!userMessage && (!files || files.length === 0))
                    return;
                isGenerating = true;
                sendBtn.innerHTML = iconStop;
                const p = document.createElement('div');
                currentControl = new AbortController();
                p.className = 'user-msg';
                p.innerText = userMessage;
                if (files && files.length > 0) {
                    const fileContainer = document.createElement('div');
                    fileContainer.style.display = 'flex';
                    fileContainer.style.flexWrap = 'wrap';
                    fileContainer.style.gap = '8px';
                    fileContainer.style.marginTop = '8px';
                    for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        if (file?.type.startsWith('image/')) {
                            const img = document.createElement('img');
                            img.src = URL.createObjectURL(file);
                            img.style.maxWidth = '100px';
                            img.style.borderRadius = '8px';
                            fileContainer.appendChild(img);
                        }
                        else {
                            const badge = document.createElement('div');
                            badge.style.cssText = 'padding:4px 8px; background:#2d2d2d; color:#fff; border-radius:4px; font-size:12px;';
                            badge.innerText = `📄 ${file?.name}`;
                            fileContainer.appendChild(badge);
                        }
                    }
                    p.appendChild(fileContainer);
                }
                chatbox.appendChild(p);
                chatbox.scrollTop = chatbox.scrollHeight;
                const ai = document.createElement('div');
                ai.className = 'sena-msg';
                chatbox.appendChild(ai);
                const formData = new FormData();
                formData.append("message", userMessage);
                if (files) {
                    for (let i = 0; i < files.length; i++) {
                        formData.append("files", files[i]);
                    }
                }
                chatInput.value = "";
                if (fileInput)
                    fileInput.value = "";
                const response = await fetch("/api/chat", {
                    method: "POST",
                    credentials: 'include',
                    body: formData,
                    signal: currentControl.signal
                });
                const reader = response.body.getReader();
                const decoder = new TextDecoder("utf-8");
                let fullReply = "";
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        ai.innerHTML = parseContent(fullReply);
                        break;
                    }
                    const chunkText = decoder.decode(value, { stream: true });
                    fullReply += chunkText;
                    ai.innerText = fullReply;
                    chatbox.scrollTop = chatbox.scrollHeight;
                }
            }
            catch (error) {
                if (error instanceof DOMException && error.name === "AbortError") {
                    console.log("手动解除");
                    if (chatbox && chatbox.lastChild instanceof HTMLElement) {
                        chatbox.lastChild.innerText += "已停止生成";
                    }
                    else if (chatbox) {
                        const p = document.createElement('p');
                        p.className = 'sena-msg';
                        p.innerText = '已停止生成';
                        chatbox.appendChild(p);
                    }
                }
                else {
                    console.error("连接失败", error);
                }
            }
            finally {
                sendBtn.innerHTML = iconArrow;
                isGenerating = false;
                currentControl = null;
            }
        };
        sendBtn.onclick = function () {
            if (isGenerating) {
                if (currentControl) {
                    currentControl.abort();
                }
            }
            else {
                aichat();
            }
        };
        chatInput.addEventListener("keydown", function (event) {
            if (event.key == "Enter") {
                if (!event.shiftKey) {
                    event.preventDefault();
                    if (isGenerating) {
                        if (currentControl) {
                            currentControl.abort();
                        }
                    }
                    else {
                        aichat();
                    }
                }
            }
        });
        const renderHistory = async () => {
            try {
                const response = await fetch("/api/chat", {
                    method: 'GET',
                    credentials: 'include'
                });
                const historyData = await response.json();
                chatbox.innerHTML = "";
                historyData.data.forEach((msg) => {
                    const p = document.createElement('div');
                    p.className = msg.role === 'user' ? 'user-msg' : 'sena-msg';
                    p.innerHTML = parseContent(msg.content);
                    if (msg.attachments && msg.attachments.length > 0) {
                        const attachContainer = document.createElement('div');
                        attachContainer.style.display = 'flex';
                        attachContainer.style.flexWrap = 'wrap';
                        attachContainer.style.gap = '8px';
                        attachContainer.style.marginTop = '8px';
                        msg.attachments.forEach(url => {
                            const ext = url.split('.').pop()?.toLowerCase();
                            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
                                const img = document.createElement('img');
                                img.src = url;
                                img.style.maxWidth = '200px';
                                img.style.borderRadius = '8px';
                                attachContainer.appendChild(img);
                            }
                            else {
                                const link = document.createElement('a');
                                link.href = url;
                                link.target = '_blank';
                                link.innerText = '📦 下载附件';
                                link.style.cssText = 'padding:4px 8px; background:#1e1e1e; color:#0a84ff; border-radius:4px; text-decoration:none; font-size:12px; border: 1px solid #0a84ff; display: inline-block;';
                                attachContainer.appendChild(link);
                            }
                        });
                        p.appendChild(attachContainer);
                    }
                    chatbox.appendChild(p);
                });
                chatbox.scrollTop = chatbox.scrollHeight;
            }
            catch (error) {
                console.error("读取失败:", error);
            }
        };
        sheet.replaceSync(`.ai-send-btn{width:2.13333333vw;height:2.13333333vw;border-radius:50%;background-color:#93C5FD;color:#111827;border:none;display:flex;justify-content:center;align-items:center;cursor:pointer;transition:all 0.2s}.ai-send-btn:hover{background-color:#60A5FA}.ai-send-btn svg{width:1.33333333vw;height:1.33333333vw}.chatTitle{display:flex;margin:1.33333333vw 16vw}.chatTitle h2{font-size:1.86666667vw;margin-right:1.33333333vw}.chatTitle .chattitle{width:2.85333333vw;height:2.85333333vw}.chatbox{height:100vh;background:rgba(255,255,255,0.8);border-radius:1.6vw;padding:2.66666667vw;margin-bottom:0.8vw;display:flex;flex-direction:column;overflow-y:auto}.input-area{display:flex;max-width:70%;margin:0 auto;align-items:center;background:#ffffff;padding:0.53333333vw 0.53333333vw 0.53333333vw 1.33333333vw;border-radius:1.06666667vw;box-shadow:0 2px 12px rgba(0,0,0,0.04);border:0.13333333vw solid rgba(244,114,182,0.2)}#chatInput{flex:1;border:none;outline:none;background:transparent;resize:none;height:2.13333333vw;max-height:8vw;padding-top:0.53333333vw;overflow-y:auto;font-size:0.8vw;color:#4b5563;font-family:inherit}#chatInput::-webkit-scrollbar{width:0.26666667vw}#chatInput::-webkit-scrollbar-thumb{background-color:rgba(244,114,182,0.3);border-radius:0.26666667vw}#chatInput::placeholder{color:#9ca3af}.ai-send-btn{width:1.86666667vw;height:1.86666667vw;border-radius:50%;background-color:#fbcfe8;color:#831843;border:none;display:flex;justify-content:center;align-items:center;cursor:pointer;transition:all 0.2s;flex-shrink:0}.ai-send-btn:hover{background-color:#f9a8d4;transform:scale(1.05)}.sena-msg{align-self:flex-start;font-size:1.06666667vw;margin-left:5.33333333vw;color:#4b5563;font-weight:bold;margin-top:1.33333333vw}.user-msg{max-width:50%;word-wrap:break-word;overflow-wrap:break-word;word-break:break-all;white-space:pre-wrap;align-self:flex-end;font-size:1.06666667vw;margin-right:5.33333333vw;border-radius:0.8vw;padding:0.53333333vw 0.8vw;text-align:center;background:#e0f2fe;margin-top:1.33333333vw}*{margin:0;padding:0;box-sizing:border-box}:host{font:16px/1.5 "Microsoft Yahei","Hiragino Sans GB","Heiti SC","WenQuanYi Micro Hei",sans-serif;color:#333}ul,ol{list-style:none}em,i{font-style:normal}a{text-decoration:none;color:#333}img{width:100%;height:100%;vertical-align:middle}input{border:none;outline:none;color:#333}h1,h2,h3,h4,h5,h6{font-weight:400}`);
        shadow.adoptedStyleSheets = [sheet];
        renderHistory();
    }
}
customElements.define("my-ai-chat", AIchat);
export {};
//# sourceMappingURL=chat.js.map