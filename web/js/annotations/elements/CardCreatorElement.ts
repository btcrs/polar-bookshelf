
export class CardCreatorElement extends HTMLElement {

    constructor() {

        super();

        // let importDoc = document.currentScript.ownerDocument;
        //
        // let template = importDoc.querySelector("template");
        //
        // //let cloneElement = this.importNode(template.content, true);
        let shadowRoot = this.attachShadow({mode: 'open'});

        let textElement = document.createElement("div");
        textElement.textContent = "hello world";

        // TODO: inject our template code here..

        `    
        <link rel="stylesheet" href="../../node_modules/font-awesome/css/font-awesome.min.css">
        <link rel="stylesheet" href="../../node_modules/bootstrap/dist/css/bootstrap.min.css">
        <link rel="stylesheet" href="../../node_modules/bootstrap/dist/css/bootstrap-grid.min.css">
        <link rel="stylesheet" href="../../node_modules/bootstrap/dist/css/bootstrap-reboot.min.css">
        <link rel="stylesheet" href="../../bootstrap4-glyphicons/maps/glyphicons-fontawesome.min.css">
        <link rel="stylesheet" href="../../node_modules/summernote/dist/summernote-bs4.css">
    
        <!-- we should be able to use bootstrap v4 but the CSS for this is actually
             better with 3.3.6 -->
        <!--<link rel="stylesheet" id="theme" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">-->
        <link rel="stylesheet" href="../../node_modules/simplemde/dist/simplemde.min.css">
        <link rel="stylesheet" href="css/card-creator.css">
    
        <div id="card-creator">
    
            <div id="schema-form">
    
            </div>
    
        </div>
        `

        shadowRoot.appendChild(textElement);

    }

}