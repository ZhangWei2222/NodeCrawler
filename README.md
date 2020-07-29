# NodeCrawler

## 前言

一直没有尝试过爬虫，总觉得可能门槛有点高，自己亲自上手后（小 demo），发现爬虫还是挺简单的，爬后很有成就感。自己爬了：豆瓣 TOP250 电影的信息和博客文章，先贴[代码仓库](https://github.com/ZhangWei2222/NodeCrawler.git)，然后记录爬虫的经过。

## 核心

爬虫的核心：**请求 url - > html（信息） -> 解析 html**

## 代码功能

1. 可分页获取所有数据
2. 生成 json 文件，数据为电影名、评分、图片地址
3. 下载图片到本地
4. 导出 excel 文件

## 使用工具

```js
const http = require("http"); // 请求 http 协议
const https = require("https"); // 请求 https 协议
const cheerio = require("cheerio"); // 爬虫必备工具，由 jquery 实现，用来解析 html 非常方便的工具
const fs = require("fs"); // 用于与文件系统进行交互
const xlsx = require("node-xlsx"); // xlsx 库
```

### 爬虫经过

1. 使用 http / https 协议 get 到网页数据
   - 注意：
     - 拿到的数据是分段拿到的,我们需要通过自己把**数据拼接**起来 `html += chunk;`
     - 网页数据是分页的话，需要定义分页的变量去取
2. 使用 cheerio 工具解析 html
   - 通过检查网页源代码查看需要的内容在哪个标签下面，然后通过\$符号来拿到需要的内容
3. 使用 fs 模块保存数据
4. 下载图片到本地
   - 爬取的图片数据是图片地址，只需要跟前面请求网页数据一样，把图片地址 url 请求回来，每一张图片写入到本地即可
5. 导出 excel
   - 使用 xlsx 库导出，并且再次调用请求函数，获取下一页的数据

```js
// 请求 url - > html（信息）  -> 解析html
const https = require("https");
const cheerio = require("cheerio");
const fs = require("fs");
const xlsx = require("node-xlsx"); //xlsx 库

let startNum = 0;
let allFilms = [];
let title = ["title", "rating_num", "img"]; //设置表头
let excelData = [];
excelData.push(title); // 添加完表头 下面就是添加真正的内容了

// 请求 top250
// 浏览器输入一个 url, get
let fetchPage = (startNum) => {
  console.log(startNum);
  https.get("https://movie.douban.com/top250" + "?start=" + startNum, function (
    res
  ) {
    // 分段返回的 自己拼接
    let html = "";
    // 有数据产生的时候 拼接
    res.on("data", function (chunk) {
      html += chunk;
    });
    // 拼接完成
    res.on("end", function () {
      const $ = cheerio.load(html);

      $("li .item").each(function () {
        let films = [];
        // this 循环时 指向当前这个电影
        // 当前这个电影下面的title
        // 相当于this.querySelector
        const title = $(".title", this).text();
        const star = $(".rating_num", this).text();
        const pic = $(".pic img", this).attr("src");
        films.push(title, star, pic);
        excelData.push(films);

        // 存 数据库
        // 没有数据库存成一个json文件 fs
        allFilms.push({
          title,
          star,
          pic,
        });
      });

      // 把数组写入json里面
      fs.writeFile("./films.json", JSON.stringify(allFilms), function (err) {
        if (!err) {
          console.log("文件写入完毕");
        }
      });
      // 图片下载一下
      downloadImage(allFilms);
      writeXls(excelData);
    });
  });
};

function downloadImage(allFilms) {
  for (let i = 0; i < allFilms.length; i++) {
    const picUrl = allFilms[i].pic;
    // 请求 -> 拿到内容
    // fs.writeFile("./xx.png", "内容");
    https.get(picUrl, function (res) {
      res.setEncoding("binary");
      let str = "";
      res.on("data", function (chunk) {
        str += chunk;
      });
      res.on("end", function () {
        fs.writeFile(`./images/${i + 1}.png`, str, "binary", function (err) {
          if (!err) {
            // console.log(`第${i}张图片下载成功`);
          } else {
            console.log(err);
          }
        });
      });
    });
  }
}

function writeXls(datas) {
  let buffer = xlsx.build([
    {
      name: "豆瓣电影 Top 250",
      data: datas,
    },
  ]);
  fs.writeFile("./豆瓣电影 Top 250.xlsx", buffer, (err) => {
    if (err) throw err;

    // 回调获取下一页数据
    if (startNum < 225) {
      fetchPage((startNum += 25));
    } else {
      console.log("File is saved!");
    }
  });
}

fetchPage(startNum);
```
