import * as THREE from "three";

const box = new THREE.Box3();

/** Writes the bounding sphere of what the model draws now (parts a filter has hidden do not count) into `out`; false when nothing shows. */
export function visibleSphere(root: THREE.Object3D, out: THREE.Sphere): boolean {
  root.updateMatrixWorld(true);
  box.makeEmpty();
  root.traverseVisible((o) => {
    if ((o as THREE.Mesh).isMesh) box.expandByObject(o);
  });
  if (box.isEmpty()) return false;
  box.getBoundingSphere(out);
  return true;
}
