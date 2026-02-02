// --- CONFIGURATION ---
const duration = 750;
const margin = {top: 20, right: 90, bottom: 30, left: 90};
let width = window.innerWidth - margin.left - margin.right;
let height = window.innerHeight - margin.top - margin.bottom;

let i = 0;
let root;
let svg, g, treemap;
let selectedNode = null;
let zoom; // Instance globale du zoom

// Données par défaut si vide
const defaultData = {
    "name": "Racine (Double-clic)",
    "children": []
};

// --- INITIALISATION ---

function init() {
    // Definir le comportement de zoom
    zoom = d3.zoom().on("zoom", (event) => {
        g.attr("transform", event.transform);
    });

    // Setup SVG
    svg = d3.select("#chart-container").append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .call(zoom) // Attacher le zoom
        .on("dblclick.zoom", null); 

    g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    treemap = d3.tree().nodeSize([45, 250]); // Ajustement espacement

    // Chargement des données
    let data;
    if (APP_MODE === 'view' && SERVER_INITIAL_DATA) {
        data = SERVER_INITIAL_DATA;
    } else if (APP_MODE === 'edit') {
        const local = localStorage.getItem('mindmap_data');
        data = local ? JSON.parse(local) : defaultData;
    } else {
        data = defaultData;
    }

    // Transformation en hiérarchie D3
    root = d3.hierarchy(data, function(d) { return d.children; });
    root.x0 = height / 2;
    root.y0 = 0;

    // Si on a beaucoup de data, on collapse par défaut (sauf si edit vide)
    if (root.children && root.children.length > 5) {
        root.children.forEach(collapse);
    }

    update(root);
    
    // Centrer
    setTimeout(resetZoom, 100);
}

// --- LOGIQUE D3 (Mise à jour) ---

function update(source) {
    const treeData = treemap(root);
    const nodes = treeData.descendants();
    const links = treeData.links();

    // Normaliser la profondeur
    nodes.forEach(d => { d.y = d.depth * 250; });

    // --- NOEUDS ---
    const node = g.selectAll('g.node')
        .data(nodes, d => d.data.id || (d.data.id = ++i));

    // ENTER
    const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", d => "translate(" + source.y0 + "," + source.x0 + ")")
        .on('click', clickNode)
        .on('dblclick', dblClickNode);

    // Rectangle
    nodeEnter.append('rect')
        .attr('width', 220)
        .attr('height', 35)
        .attr('x', 0)
        .attr('y', -17.5)
        .attr('rx', 6)
        .attr('ry', 6);

    // Texte
    nodeEnter.append('text')
        .attr("dy", ".35em")
        .attr("x", 15)
        .style("text-anchor", "start")
        .text(d => d.data.name);

    // Cercle Expander
    nodeEnter.append("circle")
        .attr("class", "expander")
        .attr("r", 5)
        .attr("cx", 220)
        .attr("cy", 0)
        .on("click", clickExpander); // Géré séparément du clic noeud

    // UPDATE
    const nodeUpdate = node.merge(nodeEnter).transition().duration(duration)
        .attr("transform", d => "translate(" + d.y + "," + d.x + ")");

    // Style conditionnel
    nodeUpdate.select('rect')
        .style("stroke", d => d === selectedNode ? "#ff9f43" : (d._children ? "#6c7ae0" : "#4a4a55"))
        .style("stroke-width", d => d === selectedNode ? "2px" : "1px");

    // Mise à jour texte (si changé)
    nodeUpdate.select('text')
        .text(d => d.data.name)
        .style("fill-opacity", 1);
        
    // Affichage expander seulement si enfants
    nodeUpdate.select('circle.expander')
        .style("display", d => (d.children || d._children || (d.data.children && d.data.children.length > 0)) ? "inline" : "none")
        .style("fill", d => d._children ? "#6c7ae0" : "#1e1e24");

    // EXIT
    const nodeExit = node.exit().transition().duration(duration)
        .attr("transform", d => "translate(" + source.y + "," + source.x + ")")
        .remove();

    nodeExit.select('rect').style("opacity", 1e-6);
    nodeExit.select('text').style("opacity", 1e-6);

    // --- LIENS ---
    const link = g.selectAll('path.link')
        .data(links, d => d.target.data.id);

    const linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr('d', d => {
            const o = {x: source.x0, y: source.y0};
            return diagonal(o, o);
        });

    const linkUpdate = link.merge(linkEnter).transition().duration(duration)
        .attr('d', d => diagonal(d.source, d.target));

    link.exit().transition().duration(duration)
        .attr('d', d => {
            const o = {x: source.x, y: source.y};
            return diagonal(o, o);
        })
        .remove();

    // Sauvegarde positions pour transitions
    nodes.forEach(d => {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

function diagonal(s, d) {
    return `M ${s.y + 220} ${s.x}
            C ${(s.y + 220 + d.y) / 2} ${s.x},
              ${(s.y + 220 + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`;
}

// --- INTERACTIONS ---

// Clic simple : Sélection
function clickNode(event, d) {
    if (APP_MODE !== 'edit') return;
    event.stopPropagation(); // Évite désélection
    selectedNode = d;
    update(d);
}

// Clic Expander : Toggle children
function clickExpander(event, d) {
    event.stopPropagation();
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
    update(d);
}

// Double clic : Édition texte
function dblClickNode(event, d) {
    if (APP_MODE !== 'edit') return;
    event.stopPropagation();
    
    const gNode = d3.select(this);
    const rect = gNode.select('rect');
    const text = gNode.select('text');
    
    // Masquer le texte SVG
    text.style('opacity', 0);
    
    // Créer un foreignObject pour l'input
    const fo = gNode.append('foreignObject')
        .attr('width', 200)
        .attr('height', 30)
        .attr('x', 10)
        .attr('y', -15);
    
    const input = fo.append('xhtml:input')
        .attr('class', 'node-input')
        .attr('value', d.data.name)
        .on('blur', function() { finishEdit(d, this.value, gNode, fo); })
        .on('keypress', function(e) {
            if (e.key === 'Enter') {
                this.blur();
            }
            e.stopPropagation(); // Empêcher interférences D3
        });
    
    input.node().focus();
}

function finishEdit(d, newVal, gNode, fo) {
    d.data.name = newVal;
    fo.remove();
    gNode.select('text').style('opacity', 1).text(newVal);
    update(d);
    saveLocal();
}

// Désélection lors d'un clic sur le fond
d3.select("body").on("click", () => {
    if (selectedNode) {
        selectedNode = null;
        update(root);
    }
});

// --- COMMANDES UTILISATEUR ---

function addChildToSelected() {
    if (!selectedNode) {
        alert("Veuillez sélectionner un noeud pour ajouter un enfant.");
        return;
    }
    
    // Créer le nouvel enfant
    const newChild = { name: "Nouveau", children: [] };
    
    // L'ajouter aux données
    if(!selectedNode.data.children) selectedNode.data.children = [];
    selectedNode.data.children.push(newChild);
    
    // Si le noeud était fermé, l'ouvrir pour voir le nouvel enfant
    if(selectedNode._children) {
        selectedNode.children = selectedNode._children;
        selectedNode._children = null;
    }
    
    // Rafraîchir la hiérarchie D3
    updateHierarchyAndRender();
    saveLocal();
}

function removeSelectedNode() {
    if (!selectedNode) {
        alert("Sélectionnez un noeud à supprimer.");
        return;
    }
    if (selectedNode === root) {
        alert("Impossible de supprimer la racine.");
        return;
    }
    
    const parent = selectedNode.parent;
    // Supprimer des données enfants du parent
    parent.data.children = parent.data.children.filter(c => c !== selectedNode.data);
    
    selectedNode = null;
    updateHierarchyAndRender();
    saveLocal();
}

// Fonction utilitaire pour reconstruire la hiérarchie après modification structurelle
function updateHierarchyAndRender() {
    // Sauvegarder l'état ouvert/fermé pourrait être complexe si on rebuild tout.
    // Simplification : On re-génère la hierarchy mais on essaie de garder l'état via les IDs si on voulait faire compliqué.
    // Ici, on refait un update standard. Pour que les nouveaux nodes apparaissent, il faut que D3 sache que 'root' a changé.
    // Le plus simple avec D3 hierarchy mutable est de ré-exécuter d3.hierarchy sur les données JSON brutes mises à jour,
    // mais cela perd l'état expand/collapse.
    
    // Mieux : Update direct des objets D3 hierarchy (ce qu'on a fait avec .push sur .data.children).
    // Mais il faut dire à D3 que children a changé.
    // D3 tree layout est calculé sur `root`. Si on modifie `root.data`, il faut re-synchroniser `root.children`.
    
    // Hack propre : On reconstruit la hiérarchie D3 depuis les données racines (root.data) tout en essayant de préserver l'état 'x,y'.
    // Mais pour "simple", on va juste recharger la vue courante (perte d'état expand local acceptable pour l'instant)
    // OU on implemente une petite synchro :
    
    // Reconstruction propre :
    // On doit reconstruire la hierarchy pour que D3 recalcule les profondeurs/parents corrects.
    const oldRoot = root;
    root = d3.hierarchy(root.data, function(d) { return d.children; });
    
    // On essaie de restaurer x0/y0 et l'état collapse
    // (Simplification : on expand tout ou on laisse par défaut. Ici on laisse par défaut pour éviter bugs).
    root.x0 = oldRoot.x0;
    root.y0 = oldRoot.y0;
    
    // Pour ne pas tout replier, on peut marquer les nodes ouverts dans data...
    // Pour l'instant : Expand tout le chemin vers le nouveau node ?
    // On va laisser le comportement par défaut de réinitialisation partielle, c'est acceptable pour un prototype.
    
    // Ré-appliquer la taille
    treemap(root);
    update(root);
}

function saveLocal() {
    if (APP_MODE === 'edit') {
        const json = JSON.stringify(root.data); // root.data est l'objet JS pur
        localStorage.setItem('mindmap_data', json);
    }
}

function resetMap() {
    if(confirm("Voulez-vous réinitialiser et tout effacer ?")) {
        localStorage.removeItem('mindmap_data');
        location.reload();
    }
}

function exportMap() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(root.data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "mindmap_" + new Date().toISOString().slice(0,10) + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// --- IMPORT JSON ---

function openImportModal() {
    document.getElementById('importModal').style.display = 'flex';
    document.getElementById('importTextarea').value = '';
    document.getElementById('importTextarea').focus();
}

function closeImportModal() {
    document.getElementById('importModal').style.display = 'none';
}

function submitImport() {
    const jsonStr = document.getElementById('importTextarea').value;
    try {
        const newData = JSON.parse(jsonStr);
        if (!newData.name) {
            throw new Error("Le JSON doit contenir au moins une propriété 'name' pour la racine.");
        }
        
        // Mise à jour des données
        root.data = newData; // root.data pointe vers l'objet brut
        
        // Reconstruire la hiérarchie D3
        // Note: On recrée complètement root pour être propre
        root = d3.hierarchy(newData, function(d) { return d.children; });
        root.x0 = height / 2;
        root.y0 = 0;
        
        // Réinitialiser la vue
        update(root);
        resetZoom();
        saveLocal();
        
        closeImportModal();
        alert("Import réussi !");
        
    } catch (e) {
        alert("Erreur lors de l'import : JSON invalide.\n" + e.message);
    }
}

async function shareMap() {
    const data = root.data;
    try {
        const response = await fetch('/api/share', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const res = await response.json();
        if(res.url) {
            prompt("Lien de partage (Lecture seule) :", res.url);
        }
    } catch(e) {
        alert("Erreur lors du partage : " + e);
    }
}

// Helpers Vues
function collapse(d) {
    if(d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
    }
}

function expandAll() {
    expand(root);
    update(root);
}

function expand(d) {
    if (d._children) {
        d.children = d._children;
        d._children = null;
    }
    if (d.children) d.children.forEach(expand);
}

function collapseAll() {
    if(root.children) root.children.forEach(collapse);
    update(root);
    resetZoom();
}

function resetZoom() {
    if (!root) return;
    
    // Calculer la position pour centrer la racine
    // root.x est la position verticale relative à 0
    // On veut placer root à : x = 150 (marge gauche), y = height / 2
    
    // Si d3.tree a placé root.x à 0, alors translation Y = height/2
    // Si root.x n'est pas 0 (ex: arbre asymétrique), on compense.
    
    const targetX = 150; // Marge gauche fixe
    const targetY = height / 2 - (root.x || 0);

    svg.transition().duration(750).call(
        zoom.transform, 
        d3.zoomIdentity.translate(targetX, targetY).scale(1)
    );
}

// Démarrer
window.addEventListener('resize', () => {
    width = window.innerWidth - margin.left - margin.right;
    height = window.innerHeight - margin.top - margin.bottom;
    update(root);
});

init();
