import {updatePaginationUI} from "./common.js";
interface article_data{
    currentPage:number;
    totalPages:number;
    totalArticles:number;
    data:string[];
}
interface article{
    content:string;
}
class NoteList extends HTMLElement{
    constructor(){
        super();
    }
    connectedCallback():void{
        let currentPage=1;
        let totalPage=1;
        const shadow=this.attachShadow({ mode: "open" });
        shadow.innerHTML=`<div class="maintopic">
        <div class="title">
            <h2>我的随笔</h2>
            <div class="box">
                <a href="https://space.bilibili.com/397877307/dynamic" target="_blank">查看更多</a>
            </div>
        </div>
        <div class="text">
            <ul id="post-list">
            </ul>
        <div class="pagination-controls">
        <button class="prev-page">⬅️ 上一页</button>
        <span class="page-info">第 1 页 / 共 1 页</span>
        <button class="next-page">下一页 ➡️</button>
        </div>
    </div>
    </div>`;
    const container1=shadow.querySelector<HTMLUListElement>(".text ul");
    const prevBtn=shadow.querySelector<HTMLButtonElement>(".prev-page");
    const nextBtn=shadow.querySelector<HTMLButtonElement>(".next-page");
    const pageinfo=shadow.querySelector<HTMLSpanElement>(".page-info");
    const sheet = new CSSStyleSheet(); 
    const loadArticleList=async (page:number=1)=>{
    try{
        const response=await fetch(`/api/posts?page=${page}&limit=4`);
        const result:article_data=await response.json();
        currentPage=result.currentPage;
        totalPage=result.totalPages;
        container1!.innerHTML='';
        const fragment=new DocumentFragment();
        result.data.forEach(title=>{
            const li=document.createElement('li');
            const titlediv=document.createElement('div');
            titlediv.className="passagetitle";
            const titleH3 = document.createElement('h3');
            titleH3.innerText=title;
            titlediv.appendChild(titleH3);
            const contentdiv=document.createElement('div');
            contentdiv.className="content";
            const readBtn=document.createElement('button');
            readBtn.innerText="展开";
            readBtn.className="fold";
            readBtn.style.cursor="pointer";
            readBtn.addEventListener('click',async ()=>{
                readBtn.innerText="获取中:D";
                readBtn.disabled=true;
                try{
                    const response=await fetch(`/api/posts/${encodeURIComponent(title)}`);
                    const article:article=await response.json();
                    contentdiv.innerHTML='';
                    const textNode=document.createElement('p');
                    if(!article.content){
                        console.log("没有返回内容");
                    }else{
                    textNode.innerText=article.content;
                    textNode.style.margin='0 1vw'
                    textNode.style.whiteSpace = 'pre-wrap'; 
                    textNode.style.lineHeight = '1.6';
                    }
                    const collapseBtn=document.createElement('button');
                    collapseBtn.className="unfold";
                    collapseBtn.innerText="收起";
                    collapseBtn.addEventListener("click",()=>{
                        contentdiv.innerHTML = '';
                        readBtn.innerText="展开";
                        readBtn.disabled=false;
                        contentdiv.appendChild(readBtn);
                    });
                    contentdiv.appendChild(textNode);
                    contentdiv.appendChild(collapseBtn);
                }
                catch(error){
                    console.log("读取失败，重试");
                }
        });
        contentdiv.appendChild(readBtn);
            li.appendChild(titlediv);
            li.appendChild(contentdiv);
            fragment.appendChild(li);
            });
            container1!.appendChild(fragment);
            updatePaginationUI({currentPage,totalPage,pageinfo,prevBtn,nextBtn});
}
    catch(error){
        console.error("加载列表失败：", error);
    }
}
    sheet.replaceSync(`.maintopic {margin: 0 auto;}.maintopic .title {display: flex;justify-content: space-between;align-items: center;margin: 2.13333333vw 21.33333333vw;}.maintopic .title h2 {font-size: 1.2vw;font-weight: 700;font-family: 'JetBrains Mono';}.maintopic .title .box {display: flex;justify-content: center;align-items: center;width: 4vw;height: 2.13333333vw;background-color: #d87cb6;border-radius: 0.53333333vw;transition: all 0.3s ease;}.maintopic .title .box a {display: inline-block;font-size: 0.8vw;text-decoration: none;font-family: 'JetBrains Mono';color: #fff;}.maintopic .title .box:hover {transform: scale(1);box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);}.maintopic .text ul {display: flex;justify-content: space-between;align-items: flex-start;margin: 0 21.33333333vw;flex-wrap: wrap;}.maintopic .text ul li {width: 48%;border-radius: 1.06666667vw;margin-bottom: 1.06666667vw;padding: 1.33333333vw;background-color: rgba(255,255,255,0.8);box-sizing: border-box;box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);transition: transform 0.3s ease, box-shadow 0.3s ease;}.maintopic .text ul li:hover {transform: scale(1);box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);}.passagetitle{font-size:1.06666667vw;text-align:center;font-weight:700;font-family:'JetBrains Mono'}.content{width:100%;margin-top:0.4vw}.content p{font-size:0.93333333vw;line-height:0.8vw}.pagination-controls{display:flex;justify-content:center;text-align:center;margin-top:2.66666667vw;text-decoration:none}.prev-page{padding:0.26666667vw 0.26666667vw;cursor:pointer}.page-info{margin:0 2.13333333vw;font-weight:bold;color:#555}.next-page{padding:0.26666667vw 0.26666667vw;cursor:pointer}.fold{margin-top:1.33333333vw;cursor:pointer;text-decoration:none;background-color:#FFB7C5;color:#F5F5F5;padding:0.53333333vw 0.8vw;border-radius:0.53333333vw;border:none}.unfold{margin-top:1.33333333vw;cursor:pointer;text-decoration:none;background-color:#FFB7C5;color:#F5F5F5;padding:0.53333333vw 0.8vw;border:none;border-radius:0.53333333vw}*{margin:0;padding:0;box-sizing:border-box}:host{font:16px/1.5 "Microsoft Yahei","Hiragino Sans GB","Heiti SC","WenQuanYi Micro Hei",sans-serif;color:#333}ul,ol{list-style:none}em,i{font-style:normal}a{text-decoration:none;color:#333}img{width:100%;height:100%;vertical-align:middle}input{border:none;outline:none;color:#333}h1,h2,h3,h4,h5,h6{font-weight:400}`);
    shadow.adoptedStyleSheets = [sheet];
    prevBtn!.addEventListener("click",()=>{if(currentPage>1){loadArticleList(currentPage-1);}});
    nextBtn!.addEventListener("click",()=>{if(currentPage<totalPage){loadArticleList(currentPage+1);}});
    const theme=localStorage.getItem("theme");
    if(theme==='dark'){
        shadow.querySelector(".title")?.classList.add("dark-theme");
    }
    loadArticleList(1);
}
}         
customElements.define('my-note-list',NoteList);