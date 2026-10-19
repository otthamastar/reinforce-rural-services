//資料路徑移至html
const countyDistJson = './api/ListCountyDist.json';//縣市名.縣市代碼.區名.區代碼
const twonJson = './api/TOWN_MOI_1111118.json';//鄉鎮界線.縣市名.縣市代碼.鄉鎮名.鄉鎮代碼
const countyDivideJson = './api/COUNTY_MOI_1090820.json';//縣市界線
const allPointJson = './api/allPonit.json';//所有改善站站點資料
const ruralPointJson ='./api/ruralPoint.json';//所有偏遠地區資料
const map1markerIcon = './img/u0lihcov.w44.svg';//map1的座標icon

// const countyDistJson = 'https://www-api.moda.gov.tw/File/Get/moda/zh-tw/Fy2byfpsfsUhzad';
// const twonJson = 'https://www-api.moda.gov.tw/File/Get/moda/zh-tw/nQAbOOu7R0QoqOh';
// const countyDivideJson = 'https://www-api.moda.gov.tw/File/Get/moda/zh-tw/9ya6cIUneXR10Zn';
// const allPointJson = 'https://www-api.moda.gov.tw/File/Get/moda/zh-tw/lrsxwQDX8t4nYEC';
// const ruralPointJson ='https://www-api.moda.gov.tw/File/Get/moda/zh-tw/YJzMKCTx7REPUbU';
// const map1markerIcon = 'img/u0lihcov.w44.svg';

//山區站點Table資訊
const map1Sele2DefaultTxt = '選擇 鄉鎮市區';
const map1Sele3DefaultTxt = '選擇 站點類型';
const map1Table1Th1 = '縣市';
const map1Table1Th2 = '類型';
const map1Table1Th3 = '改善點/步道';
const map1Table1Th4 = '通訊技術';
const map1Table1Th5 = '座標';
const map1TableSummary = '前瞻計畫「改善山區行動通訊品質計畫」之改善站點';
const map1TableCaption = '山區站點列表';

//偏遠地區Table資訊
const map3Sele2DefaultTxt = '選擇 鄉鎮市區';
const map3Table1Th1 = '縣市';
const map3Table1Th2 = '村里';
const map3Table1Th3 = '鄉鎮市區';
const map3TableSummary = '全國各縣市電信普及服務偏遠地區';
const map3TableCaption = '偏遠地區列表';

//element
const map1Sele2Default = '<option value="">'+map1Sele2DefaultTxt+'</option>';
const map1Sele3Default = '<option value="">'+map1Sele3DefaultTxt+'</option>';
const map3Sele2Default = '<option value="">'+map3Sele2DefaultTxt+'</option>';
const $map1Sele1 = $('#item1-1'),
    $map1Sele2 = $('#item1-2'),
    $map1Sele3 = $('#item1-3'),
    $map3Sele1 = $('#item3-1'),
    $map3Sele2 = $('#item3-2'),
    $numAnimate = $('.numAnimateJs');

//載入json檔
const ajxData = [];
loadData();
function loadData(){
    const urls = [
        countyDistJson,
        twonJson,
        allPointJson,
        ruralPointJson
    ];
    $.each(urls, function (idx, _url) {
        ajxData[idx] = $.ajax({
            dataType: "json",
            url: _url,
            async: true,
            success: function (result) { }
        });
    });
}

//設定地圖1、3
setMap1and3();
function setMap1and3(){
    
    //當縣市、鄉鎮、站點資料、偏遠地區資料json當載入後
    $.when(ajxData[0], ajxData[1], ajxData[2], ajxData[3]).done(function (countyDistAry, twonAry, allPointAry, ruralPointAry) {
        const countyDistData = countyDistAry[0];
        const twonData = twonAry[0].objects.TOWN_MOI_1111118.geometries;
        const allPointData = allPointAry[0];
        const ruralPointData = ruralPointAry[0];

        //設定地圖1
        setMapSvg1();
        //設定地圖3
        setMapSvg3();

        function setMapSvg1(){
            let allPoint = [];
            let setPoint = [];
            let showCounty = false;
            let showTwon = false;
            let showType = false;
            const g = d3.select("#event1Svg1").append("g");
            const projectMethod = d3.geoMercator().center([121.8, 24.18]).scale(10500);
            const pathGenerator = d3.geoPath().projection(projectMethod);
            let projection = projectMethod;

            async function draw() {
                const [jsondataCounty, csvdataPoint] = await Promise.all([
                    d3.json(countyDivideJson),//縣市界線
                    allPointData//所有改善站站點資料
                    // d3.csv(allPointCsv)
                ])
                //先讀取地圖檔
                const geometries = topojson.feature(jsondataCounty, jsondataCounty.objects["COUNTY_MOI_1090820"]);
                g.append("path")
                const paths = g.selectAll("path").data(geometries.features);

                // console.log(csvdataPoint);

                //畫縣市path
                paths.enter()
                    .append("path")
                    .attr("d", pathGenerator)
                    .attr("class", "countyI")
                    .append("text")
                    .text(d => d.properties["COUNTYNAME"]);
                
                //所有改善點資料加縣市鄉鎮市區名
                allPoint = csvdataPoint.map((list, idx) => {
                    countyDistData.map(data => {
                        if (list['縣市'] == data.countycode) {
                            list['county'] = data.county;
                        }
                    });
                    twonData.map(data => {
                        if (list['鄉鎮市區'] == data.properties.TOWNCODE) {
                            list['twon'] = data.properties.TOWNNAME;
                        }
                    });
                    list['id'] = idx;
                    return list;
                });
                setPoint = allPoint;

                //畫標點circle
                drawPoint();
                //組select
                setSelect();
            }
            draw();

            function drawPoint() {
                $("#event1Svg1 circle").remove();
                let tooltip = d3.select('#tooltip1').style('position', 'absolute')
                    .style('width', 100)
                    .style('height', 50)
                    .style('display', 'none');
                setCircle();
                setTable();

                //地圖畫上圓點
                function setCircle() {
                    g.selectAll("circle")
                        .data(setPoint)
                        .enter()
                        .append("circle")
                        .attr("cx", function (d) {
                            return projection([d["改善點東經"], d["改善點北緯"]])[0];
                        })
                        .attr("cy", function (d) {
                            return projection([d["改善點東經"], d["改善點北緯"]])[1];
                        })
                        .attr("r", 6.5)
                        .attr("data-id", function (d) {
                            return d['id'];
                        })
                        .attr('id', function (d) {
                            return 'p' + d['id'];
                        })
                        .on("click", function (d) {
                            d3.select(this).raise();
                            $('#eventMap1 .eventTable1 tr').removeClass('on');
                            $('#eventMap1 .eventTable1 tr[data-id=' + d['id'] + ']').addClass('on');
                            const line = document.getElementById('listI1-' + d['id']);
                            line.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
                        })
                        .on('mouseover', function(d){
                            d3.select(this).raise();
                            d3.select(this).select(function(d){
                                // const txt = $(this).find('text').text();
                                tooltip._groups[0][0].innerHTML = d["改善點北緯"] + ',' + d["改善點東經"];
                                tooltip.style('display', 'block');
                            })
                        })
                        .on("mousemove", function(){
                            let svgW = $('#event1Svg1').width();
                            let mapTop = $('#eventMap1').offset().top - 60;
                            let posRateW = svgW / 589.859;
                            let leftAdjust = 0;
                            if(posRateW < 1){
                                leftAdjust = d3.event.pageX-140;
                            }else if(posRateW >= 1){
                                leftAdjust = (d3.event.pageX / $window.width() * 1050);
                            }
                            tooltip.style("top", (d3.event.pageY - mapTop )+"px").style("left",(leftAdjust)+"px");

                        })
                        .on('mouseout', function(){
                            return tooltip.style('display', 'none');
                        });
                }

                //塞入表格資料
                function setTable() {
                    let tableAll = '';
                    let tableList = '';
                    
                    //組每筆改善點
                    setPoint.forEach((e) => {
                        tableList = tableList + `<tr id="listI1-${e['id']}" data-id="${e['id']}">
                            <td class="eventTable1-w1-1 text-md-center" data-th="${map1Table1Th1}">${e['county']}</td>
                            <td class="eventTable1-w1-2 text-md-center" data-th="${map1Table1Th2}">${e['類型']}</td>
                            <td class="eventTable1-w1-3" data-th="${map1Table1Th3}">${e['改善點/步道名稱']}</td>
                            <td class="eventTable1-w1-5 text-md-center" data-th="${map1Table1Th5}">
                                <a class="ps-md-2 pe-2 markerBtn markerBtnJs" href="javascript:;" role="button" title="${e['改善點/步道名稱']}座標${e['改善點北緯']} , ${e['改善點東經']}">
                                <i class="ci ci-marker" style="background-image:url(${map1markerIcon})"></i>
                                <div class="tip visually-hidden">${e['改善點北緯']} , ${e['改善點東經']}</div>
                                </a>
                            </td>
                        </tr>`;
                    })
                    //組整個改善點table
                    tableAll = `<table class="w-100" summary="${map1TableSummary}">
                    <caption class="visually-hidden">${map1TableCaption}</caption>
                    <thead class="table-light">
                        <tr class="text-center">
                            <th scope="col" class="eventTable1-w1-1">${map1Table1Th1}</th>
                            <th scope="col" class="eventTable1-w1-2">${map1Table1Th2}</th>
                            <th scope="col" class="eventTable1-w1-3">${map1Table1Th3}</th>
                            <th scope="col" class="eventTable1-w1-5">${map1Table1Th5}</th>
                        </tr>
                    </thead><tbody>${tableList}</tbody></table>`;
                    $('#eventMap1 .eventTable1')[0].innerHTML = tableAll;

                    //a11y
                    $('#eventMap1 .eventTable1').find('a').eq(-1).addClass('lastItem');
                    $('#eventMap1 .eventTable1').find('a').on('keydown', function (e) {
						var idx = $(this).parents('.tab-content').prev('.eventNav1 ').find('.active').parent('.nav-item').index();
						//內容所有連結focusout往後且不是最後一個類別時
						if (e.which === 9 && !e.shiftKey && idx!=2) {
							//是最後一個連結
							if($(this).hasClass('lastItem')){
								tabOn($('.eventNav1 .nav-item').eq(idx+1).find('.nav-link'));
								$('.eventNav1 .nav-item').eq(idx+1).find('.nav-link').click().setfocus();
							}
						}
						//內容所有連結focusout往後且是最後一個類別的最後一筆時
						// if (e.which === 9 && !e.shiftKey && idx==lastTabIdx && $(this).hasClass('lastItem')) {
						// 	$tabCon.nextAll().find('a').first().focus();
						// }
					});
                    function tabOn(e){
						e.attr({
							'tabindex':'',
							'aria-selected':'true'
						}).parent('li').siblings()
						.find('.nav-link').attr({'tabindex':-1,'aria-selected':'false'});
					}
                }

            }

            function setSelect() {
                //組縣市select
                let pointCounty = countyDistData.filter(el => {
                    return allPoint.find(element => {
                        return element.縣市 === el.countycode;
                    });
                });
                pointCounty.forEach(function (data) {
                    const options = $('<option>', {
                        value: data.countycode,
                        text: data.county
                    });
                    $map1Sele1.append(options);
                })

                //組鄉鎮市區select
                let setTwonSelect = (arr1, arr2) => {
                    let allTown = arr2.filter(e => {
                        return e.properties.COUNTYCODE == arr1;
                    });
                    let pointTown = allTown.filter(el => {
                        return allPoint.find(element => {
                            return element.鄉鎮市區 === el.properties.TOWNCODE;
                        });
                    });
                    $map1Sele2[0].innerHTML = map1Sele2Default;
                    pointTown.forEach(function (data) {
                        const options = $('<option>', {
                            value: data.properties.TOWNCODE,
                            text: data.properties.TOWNNAME
                        });
                        $map1Sele2.append(options);
                    })
                }

                //所有類型
                let typeData = setPoint.map(e=>e.類型).filter((item,index) => setPoint.map(e=>e.類型).indexOf(item) === index);
                typeData.forEach(function (data) {
                    const options = $('<option>', {
                        value: data,
                        text: data
                    });
                    $map1Sele3.append(options);;
                })

                //組類型select
                let setTypeSelect = (arr1, arr2, arr3, arr4) => {
                    let pointCounty = [];
                    let pointTown = [];
                    let pointTown2 = [];
                    let pointType = [];
                    
                    if(arr1){//有選縣市
                        pointCounty = allPoint.filter(el => {
                            return el.縣市 === arr1;
                        });
                        
                    }else{//沒選縣市
                        pointCounty = allPoint;
                    }

                    if(arr3){//有選類型
                        if(!arr2){//沒選鄉鎮
                            pointTown = pointCounty.filter(el => {
                                return el.類型 === arr3;
                            });
                            pointTown2 = [...new Map(pointTown.map((m) => [m.twon, m])).values()];
                            $map1Sele2[0].innerHTML = map1Sele2Default;
                            pointTown2.forEach(function (data) {
                                const options = $('<option>',{
                                    value:data.鄉鎮市區,
                                    text:data.twon
                                });
                                $map1Sele2.append(options);
                            })
                        }
                        if(!arr1){//沒選縣市
                            $map1Sele2[0].innerHTML = map1Sele2Default;
                        }
                    }else{//沒選類型
                        if(!arr2){//沒選鄉鎮
                            pointTown2 = [...new Map(pointCounty.map((m) => [m.twon, m])).values()];
                            $map1Sele2[0].innerHTML = map1Sele2Default;
                            if(arr1){//有選縣市
                                pointTown2.forEach(function (data) {
                                    const options = $('<option>',{
                                        value:data.鄉鎮市區,
                                        text:data.twon
                                    });
                                    $map1Sele2.append(options);
                                })
                            }else{//沒選縣市
                                $map1Sele2[0].innerHTML = map1Sele2Default;
                            }
                        }else{//有選鄉鎮
                            pointTown = pointCounty.filter(el => {
                                return el.鄉鎮市區 === arr2;
                            });
                        }

                        $map1Sele3[0].innerHTML = map1Sele3Default;
                        pointType = arr4.filter(el => {
                            if(arr2){//有選鄉鎮
                                return pointTown.find(element => {
                                    return element.類型 === el;
                                });
                            }else{//沒選鄉鎮
                                return pointCounty.find(element => {
                                    return element.類型 === el;
                                });
                            }
                        });
                        pointType.forEach(function (data) {
                            const options = $('<option>',{
                                value:data,
                                text:data
                            });
                            $map1Sele3.append(options);
                        })
                        
                    }
                }

                let a11yRead = false;//a11y用
                function pointFilter() {
                    //沒做篩選，預設顯示所有資料
                    let infoDefault = '<span>全部，</span>';
                    let infoDefaultA11y = '全部，';
                    let infoCoutry = '';
                    let infoCoutryA11y = '';
                    let infoTwon = '';
                    let infoTwonA11y = '';
                    let infoType = '';
                    let infoTypeA11y = '';
                    let infoNum = (e) => {
                        let num = e.length;
                        return '共 '+ num +' 筆';
                    }

                    function setInfo(){
                        const infoAll = infoDefault + infoCoutry + infoTwon + infoType + infoNum(setPoint);
                        $('#eventMap1 .evnetDataInfo1')[0].innerHTML = infoAll;
                        //select change才報讀
                        if(a11yRead){
                            const infoAllA11y = infoDefaultA11y + infoCoutryA11y + infoTwonA11y + infoTypeA11y + infoNum(setPoint);
                            if (typeof FunSpeaking === "function") {
                                FunSpeaking(infoAllA11y);
                            }
                        }
                    }

                    
                    setPoint = allPoint;
                    setInfo();
                    
                    if (showCounty) {
                        //有篩選縣市
                        setPoint = allPoint.filter(e => e.縣市 == showCounty);
                        infoDefault = '';
                        infoDefaultA11y = '';
                        infoCoutry = '縣市：<span>' + setPoint[0].county + '</span>，';
                        infoCoutryA11y = '縣市：' + setPoint[0].county + '，';
                        setInfo();
                        if (showTwon) {
                            //有篩選鄉鎮市區
                            setPoint = setPoint.filter(e => e.鄉鎮市區 == showTwon);
                            infoTwon = '鄉鎮市區：<span>' + setPoint[0].twon + '</span>，';
                            infoTwonA11y = '鄉鎮市區：' + setPoint[0].twon + '，';
                            setInfo();
                        }
                    }
                    if (showType) {
                        //有篩選類型
                        setPoint = setPoint.filter(e => e.類型 == showType);
                        infoType = '站點類型：<span>'+ showType + '</span>，';
                        infoTypeA11y = '站點類型：'+ showType + '，';
                        setInfo();
                    }

                }
                pointFilter();

                //選縣市
                $map1Sele1.change(function () {
                    showCounty = this.value;
                    showTwon = 0;
                    showType = 0;
                    a11yRead = true;
                    setTwonSelect(showCounty, twonData);
                    setTypeSelect(showCounty, '', '', typeData);
                    pointFilter();
                    drawPoint();
                });
                //鄉鎮市區
                $map1Sele2.change(function () {
                    showTwon = this.value;
                    showType = 0;
                    a11yRead = true;
                    setTypeSelect(showCounty, showTwon, '', typeData);
                    pointFilter();
                    drawPoint();
                });
                //選類型
                $map1Sele3.change(function () {
                    showType = this.value;
                    a11yRead = true;
                    setTypeSelect(showCounty, showTwon, showType, typeData);
                    pointFilter();
                    drawPoint();
                });
            }


            //click and hover event
            const showCircle = (e) => {
                $('#event1Svg1 circle').removeClass('on');
                d3.select($('circle[data-id=' + e + ']')[0]).raise().classed("on", true);
            }
            // $body.on('click', '.markerBtnJs', function () {
            //     const num = $(this).parent().parent('tr').data('id');
            //     $(this).parent().parent('tr').addClass('on').siblings().removeClass('on');
            //     showCircle(num);
            //     // $('#event1Svg1 circle').removeClass('on');
            //     // $mapSvg1.find('circle[data-id=' + num + ']').addClass('on');
            // });
            $body.on('click', '#eventMap1 .eventTable1 tr', function () {
                const num = $(this).data('id');
                $(this).addClass('on').siblings().removeClass('on');
                showCircle(num);
            });
            $body.on("mouseenter focus", '.markerBtnJs', function () {
                $(this).find('.tip').removeClass('visually-hidden');
            });
            $body.on("mouseleave focusout", '.markerBtnJs', function () {
                $(this).find('.tip').addClass('visually-hidden');
            });
            $body.on('click', '#event1Svg1 circle', function () {
                $('#event1Svg1 circle').removeClass('on');
                $(this).addClass('on');
            });

            //click outside remove on
            $window.on('click', function (event) {
                let tableElement = $('#eventMap1 .eventTable1');
                let mapElement = $('#eventMap1 .eventMapWrap1');
                let isInsideClicked = tableElement[0].contains(event.target) || mapElement[0].contains(event.target);
                if (!isInsideClicked) {
                    tableElement.find('tr').removeClass('on');
                    $('#event1Svg1 circle').removeClass('on');
                }
            });

            //copy經緯,可刪
            $body.on('click', '.markerBtnJs .tip', function () {
                // 建立 Range 物件
                const range = document.createRange();
                // 將指定元素內容加到 Range 中
                // const texts = document.querySelector('.tip');
                const texts = $(this)[0];
                // console.log($(this)[0]);
                range.selectNode(texts);
                // 取得 Selection 物件
                const selection = window.getSelection();
                // 先清空當前選取範圍
                selection.removeAllRanges();
                // 加入 Range 
                selection.addRange(range);
                
                document.execCommand('copy');
                selection.removeAllRanges();
            });
        }
        
        function setMapSvg3(){
            let allPoint3 = [];
            let allPoint3Merge = [];
            let setPoint3 = [];
            let showCounty3 = '';
            let showTown3 = '';
            let showDistrict = false;
            const svg = d3.select("#event1Svg3");
            const g = $('#event1Svg3 .countyI');
            let tooltip = d3.select('#tooltip3').style('position', 'absolute')
            .style('width', 100)
            .style('height', 50)
            .style('display', 'none');
            
            async function draw() {
                const [csvdataPoint] = await Promise.all([
                    ruralPointData,
                ])                

                //所有標點資料加縣市鄉鎮市區名
                allPoint3 = csvdataPoint.map((list) => {
                    countyDistData.map(data => {
                        // if (list['地區'] == data.district) {
                        //     list['districtcode'] = data.districtcode;
                        // }
                        if (list['縣市'] == data.county) {
                            list['county'] = data.countycode;
                        }
                    });
                    twonData.map(data => {
                        if (list['鄉鎮市區'] == data.properties.TOWNNAME) {
                            list['twon'] = data.properties.TOWNCODE;
                        }
                    });
                    // list['id'] = idx;
                    return list;
                });
                // allPoint3Merge = allPoint3.map((item, idx) => ({
                //     ...item,
                //     id: idx
                // }));
                // console.log(allPoint3);
                allPoint3.forEach(function (item) {
                    const existing = allPoint3Merge.filter(function (v, i) {
                        return v.twon == item.twon;
                    });
                    if (existing.length) {
                        const existingIndex = allPoint3Merge.indexOf(existing[0]);
                        allPoint3Merge[existingIndex].村里 = allPoint3Merge[existingIndex].村里.concat(item.村里);
                        
                    } else {
                        if (typeof item.村里 == 'string')
                            item.村里 = [item.村里];
                            allPoint3Merge.push(item);
                    }
                });
                allPoint3Merge.map((e,idx)=>e.id = idx);
                setPoint3 = allPoint3Merge;
                // console.log(setPoint3);//所有鄉

                svg.selectAll("g")
                    .on('mouseover', function(e){
                        d3.select(this).raise();
                        d3.select(this).select(function(e){
                            const txt = $(this).find('text').text();
                            tooltip._groups[0][0].innerHTML = txt;
                            tooltip.style('display', 'block');
                        })
                    })
                    .on("mousemove", function(){
                        let svgW = $('#event1Svg3').width();
                        let posRate = svgW / 589.859;
                        let yValue;
                        (posRate >= 0.9)?yValue=-100:yValue=20;
                        return tooltip.style("top", (d3.event.pageY+yValue)+"px").style("left",(d3.event.pageX+10)+"px");
                    })
                    .on('mouseout', function(){
                        return tooltip.style('display', 'none');
                    });
                //列table
                drawPoint();
                //組select
                setSelect();
            }
            draw();

            function drawPoint() {
                setCounty();
                setTable();

                //show地圖上縣市
                function setCounty(){
                    const showCounty = setPoint3.map(e=>e.縣市).filter((item,index) => setPoint3.map(e=>e.縣市).indexOf(item) === index);
                    $('#event1Svg3 g').removeClass('on');
                    $('#event1Svg3 g').each(function(){
                        const county = $(this).find('text').text();
                        if(showCounty.indexOf(county) >= 0){
                            $(this).addClass('on');
                        }
                    });
                }

                //塞入表格資料
                function setTable() {
                    let tableAll = '';
                    let tableList = '';
                    setPoint3.forEach((e) => {
                        tableList = tableList + `<tr id="listI3-${e['id']}" data-id="${e['id']}">
                            <td class="eventTable1-w3-1 text-md-center" data-th="${map3Table1Th1}">${e['縣市']}</td>
                            <td class="eventTable1-w3-1 text-md-center" data-th="${map3Table1Th3}">${e['鄉鎮市區']}</td>
                            <td class="eventTable1-w3-2" data-th="${map3Table1Th2}">${e['村里'].join('、')}</td>
                        </tr>`;
                    })
                    // setPoint
                    tableAll = `<table class="w-100" summary="${map3TableSummary}">
                    <caption class="visually-hidden">${map3TableCaption}</caption>
                    <thead class="table-light">
                        <tr class="text-center">
                            <th scope="col" class="eventTable1-w3-1">${map3Table1Th1}</th>
                            <th scope="col" class="eventTable1-w3-1">${map3Table1Th3}</th>
                            <th scope="col" class="eventTable1-w3-2">${map3Table1Th2}</th>
                        </tr>
                    </thead><tbody>${tableList}</tbody></table>`;
                    $('#eventMap3 .eventTable1')[0].innerHTML = tableAll;
                }
            }

            function setSelect() {

    // 縣市 select
    $map3Sele1.empty().append('<option value="">選擇 縣市</option>');

    let pointCounty = setPoint3.filter((item, index, array) => {
        let itemIndex = array.findIndex(b => item.縣市 === b.縣市);
        return index === itemIndex;
    });

    pointCounty.forEach(function (data) {
        const options = $('<option>', {
            value: data.縣市,
            text: data.縣市
        });
        $map3Sele1.append(options);
    });

    // 鄉鎮 function
    let setTownSelect = (county, data) => {

        let result = county
            ? data.filter(e => e.縣市 == county)
            : [];

        let townList = result.filter((item, index, array) => {
            let itemIndex = array.findIndex(b => item.鄉鎮市區 === b.鄉鎮市區);
            return index === itemIndex;
        });

        $map3Sele2.html(map3Sele2Default);

        townList.forEach(function (data) {
            const options = $('<option>', {
                value: data.鄉鎮市區,
                text: data.鄉鎮市區
            });
            $map3Sele2.append(options);
        });
    };

    // 篩選 function
    function pointFilter() {

        setPoint3 = allPoint3Merge;

        if (showCounty3) {
            setPoint3 = setPoint3.filter(e => e.縣市 == showCounty3);
        }

        if (showTown3) {
            setPoint3 = setPoint3.filter(e => e.鄉鎮市區 == showTown3);
        }

        drawPoint();
    }

    // 4. 綁事件
    $map3Sele1.off('change').on('change', function () {

        showCounty3 = $(this).val();

        showTown3 = '';
        $map3Sele2.val('');

        setTownSelect(showCounty3, allPoint3Merge);

        pointFilter();
    });

    $map3Sele2.off('change').on('change', function () {

        showTown3 = $(this).val();

        pointFilter();
    });

    // 👉 5. 初始化（重點）
    $map3Sele2.html('<option value="">選擇 鄉鎮市區</option>');
        pointFilter();
    }
        }

    });
}

//設定地圖2
$(document).ready(function () {
        const $window = $(window);
        const $body = $('body');
        const svg = d3.select("#event1Svg2");
        const tooltip = d3.select('#tooltip2')
            .style('position', 'absolute')
            .style('width', 100)
            .style('height', 50)
            .style('display', 'none');

        const showLine = (id) => {
            $('#event1Svg2 .lineI').removeClass('on');
            d3.select($(`.lineI[data-id="${id}"]`)[0]).raise().classed("on", true);
        };

        // 表格點擊同步 SVG
        $body.on('click', '#eventMap2 .eventTable1 tbody tr', function () {
            const id = $(this).data('id');
            $(this).addClass('on').siblings().removeClass('on');
            $(this).parents('.eventTable1').siblings().find('tr').removeClass('on');
            showLine(id);
            if (!$(this).closest('table').is('#eventMap2-stop')) {
                // 取消篩選：顯示所有 SVG
                $('#event1Svg2 g.lineI').show();
                // 重設 select
                $('#item2-2').val("0").trigger('change');
                $('#item2-1').val("0").trigger('change');
            }
        });

        // SVG 點擊同步表格 + 捲動
        $body.on('click', '#event1Svg2 .lineI', function () {
            const id = $(this).data('id');
            $(this).addClass('on').siblings().removeClass('on');

            const $targetTr = $('.eventTable1 tbody tr[data-id="' + id + '"]');
            $targetTr.addClass('on').siblings().removeClass('on');

            const $tbody = $targetTr.closest('tbody');
            const offset = 50;
            const scrollTop = $targetTr.position().top + $tbody.scrollTop() - offset;
            $tbody.animate({ scrollTop }, 300);

            showLine(id);
        });

        // 外部點擊清除選取
        $window.on('click', function (e) {
            const $table = $('#eventMap2 .eventTable1 tbody');
            const $map = $('#eventMap2 .eventTwoCol1L');
            const isInside = $table.has(e.target).length || $map.has(e.target).length;
            if (!isInside) {
                $table.find('tr').removeClass('on');
                $('#event1Svg2 .lineI').removeClass('on');
            }
        });

        // Tooltip 顯示
        svg.selectAll("circle")
            .on('mouseover', function () {
                d3.select(this).raise();
                const txt = d3.select(this.parentNode).select('text').text();
                tooltip.text(txt).style('display', 'block');
            })
            .on("mousemove", function () {
                const svgW = $('#event1Svg2').width();
                const mapTop = $('#eventMap2').offset().top + 50;
                const posRateW = svgW / 589.859;
                const leftAdjust = posRateW < 1
                    ? d3.event.pageX - 140
                    : d3.event.pageX / $window.width() * 1050;

                tooltip
                    .style("top", `${d3.event.pageY - mapTop}px`)
                    .style("left", `${leftAdjust}px`);
            })
            .on('mouseout', () => tooltip.style('display', 'none'));

        // 篩選縣市：同步表格與 SVG
        $('#item2-1').change(function () {
            const val = $(this).val();

            // 表格篩選
            $('#eventMap2-stop tbody tr').each(function () {
                const match = $(this).find('td:nth-child(2)').text().includes(val);
                $(this).toggle(val === "0" || match);
            });

            // SVG 篩選
            $('#event1Svg2 g.lineI').each(function () {
                const match = $(this).data('value') === val;
                $(this).toggle(val === "0" || match);
            });
        });
        $('#item2-2').change(function () {
            const val = $(this).val();

            // 表格篩選
            $('#eventMap2-stop tbody tr').each(function () {
                const match = $(this).find('td:nth-child(1)').text().includes(val);
                $(this).toggle(val === "0" || match);
            });

            // SVG 篩選
            $('#event1Svg2 g.lineI').each(function () {
                const match = $(this).data('line') === val;
                $(this).toggle(val === "0" || match);
            });
        });
});


//數字動態
// let scollToNum = false;
// $window.scroll(function() {
//     const numT = $numAnimate.offset().top,
//         numH = $numAnimate.outerHeight(),
//         wH = $window.height(),
//         wS = $(this).scrollTop();
//     if (wS > (numT+numH-wH) && !scollToNum){
//         $numAnimate.countTo();
//         scollToNum = true;
//     }
// });

// const $window = $(window);

// $window.on('scroll', function () {
//     $('.numAnimateJs-2025').each(function () {
//         const $this = $(this);

//         if ($this.hasClass('animated')) return; // 已執行過動畫

//         const elemTop = $this.offset().top;
//         const elemHeight = $this.outerHeight();
//         const windowHeight = $window.height();
//         const scrollTop = $window.scrollTop();

//         if (scrollTop > (elemTop + elemHeight - windowHeight)) {
//             $this.countTo(); // 啟動 countTo 數字動畫
//             $this.addClass('animated'); // 防止重複啟動
//         }
//     });
// });