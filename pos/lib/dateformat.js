function addZero(num){
    return num < 10 ? '0'+num : num;
}

function formatDate() {
    let d = new Date(),
        month = addZero(d.getMonth() + 1),
        day = addZero(d.getDate()),
        year = addZero(d.getFullYear()),
        hours= addZero(d.getHours()),
        minutes = addZero(d.getMinutes()),
        seconds = addZero(d.getSeconds());
    return [year, month, day].join('-')+'_'+hours+'h'+minutes+'m'+seconds+'s';
}
