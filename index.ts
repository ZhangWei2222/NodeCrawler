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
