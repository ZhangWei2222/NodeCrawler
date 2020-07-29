// 请求 url - > html（信息）  -> 解析html
const http = require("http");
const cheerio = require("cheerio");
const fs = require("fs");
const xlsx = require("node-xlsx"); //xlsx 库

let page = 1;
let allFilms = [];
let title = ["time", "title", "category", "word"]; //设置表头
let excelData = [];
excelData.push(title); // 添加完表头 下面就是添加真正的内容了

// 请求 top250
// 浏览器输入一个 url, get
let fetchPage = (startNum) => {
  console.log(startNum);
  http.get("http://super-wei.top/page/" + page + "/", function (res) {
    // 分段返回的 自己拼接
    let html = "";
    // 有数据产生的时候 拼接
    res.on("data", function (chunk) {
      html += chunk;
    });
    // 拼接完成
    res.on("end", function () {
      const $ = cheerio.load(html);

      $("#posts .post").each(function () {
        let films = [];
        const time = $(".post-meta-item time", this).text();
        const title = $(".post-title a", this).text();
        const category = $(".post-meta-item span a span", this).text();
        const word = $(
          ".post-meta-item:nth-child(5) .post-meta-item-text",
          this
        )
          .next()
          .text();

        // const pic = $(".pic img", this).attr("src");
        films.push(time, title, category, word);
        excelData.push(films);

        allFilms.push({
          time,
          title,
          category,
          word,
        });
      });

      // 把数组写入json里面
      fs.writeFile("./films.json", JSON.stringify(allFilms), function (err) {
        if (!err) {
          console.log("文件写入完毕");
        }
      });

      writeXls(excelData);
    });
  });
};

function writeXls(datas) {
  let buffer = xlsx.build([
    {
      name: "微的博客",
      data: datas,
    },
  ]);
  fs.writeFile("./微的博客.xlsx", buffer, (err) => {
    if (err) throw err;

    // 回调获取下一页数据
    // if (startNum < 225) {
    fetchPage((page += 1));
    // } else {
    console.log("File is saved!");
    // }
  });
}

fetchPage(page);
