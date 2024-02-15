export function filterHTMLContent(contentString: string, tag: string) {
    const tagStartRegex = new RegExp("<" + tag + ">");
    const tagEndRegex = new RegExp("</" + tag + ">");
    let tagInnerString: string = contentString.substring(contentString.search(tagStartRegex)+6, contentString.search(tagEndRegex)).trim();
    let tagInner: string[] = tagInnerString.split(/(<.*>)/);

    return tagInner;

}

export function addBaseAddress(array: string[], appAddress: string, contentAddress: string): string[] {
    let ret: string[] = [];
    const linkRegex = new RegExp('link(.*)href="(.*)"', "g");
    const scriptRegex = new RegExp('script(.*)src="(.*)"', "g");
    const aTagRegex = new RegExp('a(.*)href="(.*)"', "g");

    for(let line of array) {
        if(line.search(/href|src/) > -1) {
            line = line.replaceAll(linkRegex, 'link $1 href="http://' + appAddress + '$2"');
            line = line.replaceAll(scriptRegex, 'script $1 src="http://' + appAddress + '$2"');
            line = line.replaceAll(aTagRegex, 'a $1 href="' + contentAddress + '?url=$2"');

            ret.push(line);
        }
        else {
            ret.push(line);
        }
    }

    return ret;
}